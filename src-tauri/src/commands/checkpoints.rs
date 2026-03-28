use git2::{Repository, Signature, Oid};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckpointInfo {
    pub id: String,       // Commit SHA
    pub message: String,  // Commit message
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoredContent {
    pub content: String,
    pub checkpoint: CheckpointInfo,
}

/// Create a checkpoint (git commit) for a scenario before AI editing
#[command]
pub async fn create_scenario_checkpoint(
    project_path: String,
    scenario_id: String,
    content: String,
    message: String,
) -> Result<CheckpointInfo, String> {
    let project_path = PathBuf::from(&project_path);

    // Find the scenario file (project.scenex/scenarios/{id}.md or similar)
    // For now, we'll create a .scenex-ai-backup directory for checkpoints
    let backup_dir = project_path.join(".scenex-ai-backup").join(&scenario_id);
    std::fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Write the current content to backup
    let backup_file = backup_dir.join(format!("{}.md", chrono::Utc::now().timestamp_millis()));
    std::fs::write(&backup_file, &content)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    // Get repo (must be initialized at project root)
    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    // Add the backup file to git
    let mut index = repo.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;

    let relative_path = backup_file.strip_prefix(&project_path)
        .map_err(|e| format!("Failed to get relative path: {}", e))?;

    index.add_path(relative_path)
        .map_err(|e| format!("Failed to add file to index: {}", e))?;
    index.write()
        .map_err(|e| format!("Failed to write index: {}", e))?;

    // Create tree and commit
    let tree_id = index.write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id)
        .map_err(|e| format!("Failed to find tree: {}", e))?;

    let sig = Signature::now("SceneX AI", "ai@scenex.local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    let parent_commits: Vec<git2::Commit> = match repo.head() {
        Ok(head) => {
            let commit = head.peel_to_commit()
                .map_err(|e| format!("Failed to peel to commit: {}", e))?;
            vec![commit]
        }
        Err(_) => vec![],
    };

    let parent_refs: Vec<&git2::Commit> = parent_commits.iter().collect();

    let full_message = format!("ai-edit(scenario): {}", message);

    let commit_id = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &full_message,
        &tree,
        &parent_refs,
    ).map_err(|e| format!("Failed to create commit: {}", e))?;

    Ok(CheckpointInfo {
        id: commit_id.to_string(),
        message: full_message,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// Restore scenario content from a checkpoint
#[command]
pub async fn restore_scenario_checkpoint(
    project_path: String,
    checkpoint_id: String,
    scenario_id: String,
) -> Result<RestoredContent, String> {
    let project_path = PathBuf::from(&project_path);

    let commit_oid = Oid::from_str(&checkpoint_id)
        .map_err(|e| format!("Invalid checkpoint ID: {}", e))?;

    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let commit = repo.find_commit(commit_oid)
        .map_err(|e| format!("Failed to find commit: {}", e))?;

    let tree = commit.tree()
        .map_err(|e| format!("Failed to get tree: {}", e))?;

    // Find the backup file in the tree - look for .scenex-ai-backup/{scenario_id}/*.md
    let prefix = format!(".scenex-ai-backup/{}/", scenario_id);

    let mut content: Option<String> = None;

    // Get the subtree for .scenex-ai-backup/{scenario_id}/
    if let Ok(subtree_entry) = tree.get_path(std::path::Path::new(&prefix)) {
        // subtree_entry is a TreeEntry pointing to a Tree (directory)
        let subtree_id = subtree_entry.id();
        if let Ok(subtree) = repo.find_tree(subtree_id) {
            // subtree is a Tree containing the .md files
            for entry in subtree.iter() {
                if let Some(name) = entry.name() {
                    if name.ends_with(".md") {
                        let blob = repo.find_blob(entry.id())
                            .map_err(|e| format!("Failed to find blob: {}", e))?;
                        content = Some(String::from_utf8_lossy(blob.content()).to_string());
                        break;
                    }
                }
            }
        }
    }

    let content = content.ok_or_else(|| "Backup file not found in checkpoint".to_string())?;

    Ok(RestoredContent {
        content,
        checkpoint: CheckpointInfo {
            id: checkpoint_id,
            message: commit.summary().unwrap_or_default().to_string(),
            timestamp: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        },
    })
}

/// List checkpoint commits for a scenario
#[command]
pub async fn list_scenario_checkpoints(
    project_path: String,
    scenario_id: String,
    limit: u32,
) -> Result<Vec<CheckpointInfo>, String> {
    let project_path = PathBuf::from(&project_path);

    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let mut revwalk = repo.revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;

    revwalk.push_head()
        .map_err(|e| format!("Failed to push head: {}", e))?;

    let mut checkpoints = Vec::new();
    let prefix = format!(".scenex-ai-backup/{}/", scenario_id);

    for (count, oid_result) in revwalk.enumerate() {
        if count >= limit as usize {
            break;
        }

        let oid = oid_result
            .map_err(|e| format!("Failed to get oid: {}", e))?;

        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        let message = commit.summary().unwrap_or_default().to_string();

        // Only include AI edit checkpoints for this scenario
        if message.starts_with("ai-edit(scenario):") {
            let tree = commit.tree()
                .map_err(|e| format!("Failed to get tree: {}", e))?;

            // Check if this commit has a file for our scenario
            let has_scenario_file = tree.get_path(std::path::Path::new(&prefix)).is_ok();

            if has_scenario_file {
                checkpoints.push(CheckpointInfo {
                    id: oid.to_string(),
                    message,
                    timestamp: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default(),
                });
            }
        }
    }

    Ok(checkpoints)
}