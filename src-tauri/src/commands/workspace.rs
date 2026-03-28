use git2::{Repository, Signature};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub path: String,
    pub name: String,
    pub file_path: String,
    pub modified_at: Option<String>,
}

/// Create a new project in a parent folder
#[command]
pub async fn create_project(
    parent_folder_path: String,
    project_name: String,
) -> Result<ProjectInfo, String> {
    let parent = PathBuf::from(&parent_folder_path);
    let project_dir = parent.join(&project_name);
    let project_file = project_dir.join(format!("{}.scenex", project_name));

    eprintln!("[DEBUG] create_project: parent_folder={}, project_name={}", parent_folder_path, project_name);
    eprintln!("[DEBUG] create_project: project_dir={}", project_dir.display());
    eprintln!("[DEBUG] create_project: project_file={}", project_file.display());

    // Create parent directory if it doesn't exist
    fs::create_dir_all(&parent)
        .map_err(|e| format!("Failed to create parent directory: {}", e))?;

    // Create project directory
    fs::create_dir_all(&project_dir)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create initial project file with scenario structure
    let now = chrono::Local::now().to_rfc3339();
    let scenario_id = uuid::Uuid::new_v4().to_string();
    let initial_project = serde_json::json!({
        "id": uuid::Uuid::new_v4().to_string(),
        "name": project_name,
        "createdAt": now,
        "updatedAt": now,
        "scenario": {
            "id": scenario_id,
            "name": project_name,
            "description": "",
            "content": format!("# {}\n\n## Act 1\n\n### INT. LOCATION - TIME\n", project_name),
            "scenes": [{
                "id": uuid::Uuid::new_v4().to_string(),
                "name": "Scene 1",
                "slugline": "INT. LOCATION - TIME",
                "description": "",
                "scriptLines": [],
                "panels": []
            }],
            "createdAt": now,
            "updatedAt": now
        }
    });

    let json = serde_json::to_string_pretty(&initial_project)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    fs::write(&project_file, json).map_err(|e| format!("Failed to write project file: {}", e))?;
    eprintln!("[DEBUG] create_project: file written, exists={}", project_file.exists());

    // Initialize or update git repository
    // Try to find existing repo in parent hierarchy, or init new one in project dir
    let repo = match Repository::discover(&parent) {
        Ok(repo) => repo,
        Err(_) => {
            // No git repo found, initialize one in the project directory
            Repository::init(&project_dir)
                .map_err(|e| format!("Failed to initialize git repository: {}", e))?
        }
    };

    let repo_path = repo.path().parent()
        .ok_or_else(|| "Could not determine repository path".to_string())?
        .to_path_buf();

    let mut index = repo.index().map_err(|e| e.to_string())?;

    // Add the project file (use repo-relative path)
    let relative_path = project_file.strip_prefix(&repo_path).map_err(|e| e.to_string())?;
    index.add_path(relative_path).map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;

    // Create commit
    let sig = Signature::now("SceneX", "scenex@app.local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    let tree_id = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|e| e.to_string())?;

    // Check if this is the first commit (no HEAD)
    let parent_commits: Vec<git2::Commit> = match repo.head() {
        Ok(head) => {
            let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
            vec![commit]
        }
        Err(_) => vec![],
    };

    let parent_refs: Vec<&git2::Commit> = parent_commits.iter().collect();

    let commit_message = format!("Create project: {}", project_name);
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &commit_message,
        &tree,
        &parent_refs,
    )
    .map_err(|e| format!("Failed to create commit: {}", e))?;

    // Get modified time
    let metadata = fs::metadata(&project_file).ok();
    let modified_at = metadata.and_then(|m| m.modified().ok()).map(|t| {
        let datetime: chrono::DateTime<chrono::Local> = t.into();
        datetime.to_rfc3339()
    });

    Ok(ProjectInfo {
        path: project_dir.to_string_lossy().to_string(),
        name: project_name,
        file_path: project_file.to_string_lossy().to_string(),
        modified_at,
    })
}

/// Perform git auto-commit for a project
#[command]
pub async fn git_auto_commit(
    project_folder_path: String,
    project_name: String,
    message: String,
) -> Result<String, String> {
    let project_dir = PathBuf::from(&project_folder_path);
    let project_file = project_dir.join(format!("{}.scenex", project_name));

    if !project_file.exists() {
        return Err(format!("Project file not found: {}", project_file.display()));
    }

    // Try to find git repo in parent hierarchy, or use project dir
    let repo = match Repository::discover(&project_dir) {
        Ok(repo) => repo,
        Err(_) => {
            // No git repo found, initialize one
            Repository::init(&project_dir)
                .map_err(|e| format!("Failed to initialize git repository: {}", e))?
        }
    };

    let repo_path = repo.path().parent()
        .ok_or_else(|| "Could not determine repository path".to_string())?
        .to_path_buf();

    let mut index = repo.index().map_err(|e| e.to_string())?;

    // Add the project file
    let relative_path = project_file.strip_prefix(&repo_path).map_err(|e| e.to_string())?;
    index.add_path(relative_path).map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;

    // Check if there are changes to commit
    let tree_id = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|e| e.to_string())?;

    // Compare with HEAD
    let head_tree = match repo.head() {
        Ok(head) => {
            let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
            Some(commit.tree().map_err(|e| e.to_string())?)
        }
        Err(_) => None,
    };

    // Check if there are actual changes
    let has_changes = match &head_tree {
        Some(head_tree) => {
            let diff = repo
                .diff_tree_to_tree(Some(head_tree), Some(&tree), None)
                .map_err(|e| e.to_string())?;
            diff.deltas().len() > 0
        }
        None => true, // First commit
    };

    if !has_changes {
        return Ok("No changes to commit".to_string());
    }

    // Create commit
    let sig = Signature::now("SceneX", "scenex@app.local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    // Get parent commits
    let parent_commits: Vec<git2::Commit> = match repo.head() {
        Ok(head) => {
            let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
            vec![commit]
        }
        Err(_) => vec![],
    };

    let parent_refs: Vec<&git2::Commit> = parent_commits.iter().collect();

    let commit_id = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            &message,
            &tree,
            &parent_refs,
        )
        .map_err(|e| format!("Failed to create commit: {}", e))?;

    Ok(commit_id.to_string())
}
