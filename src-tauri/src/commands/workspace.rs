use git2::{Repository, Signature};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub path: String,
    pub name: String,
    pub is_git_repo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub path: String,
    pub name: String,
    pub file_path: String,
    pub modified_at: Option<String>,
}

/// Get the default workspaces directory (~/Documents/SceneX)
#[command]
pub async fn get_default_workspaces_dir() -> Result<String, String> {
    let home = dirs::home_dir()
        .ok_or_else(|| "Could not find home directory".to_string())?;
    let workspaces_dir = home.join("Documents").join("SceneX");

    // Create directory if it doesn't exist
    fs::create_dir_all(&workspaces_dir).map_err(|e| e.to_string())?;

    Ok(workspaces_dir.to_string_lossy().to_string())
}


/// Create a new workspace (folder with git init)
#[command]
pub async fn create_workspace(path: String) -> Result<WorkspaceInfo, String> {
    let path = PathBuf::from(&path);

    // Create the directory
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))?;

    // Initialize git repository
    Repository::init(&path).map_err(|e| format!("Failed to initialize git repository: {}", e))?;

    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unnamed Workspace".to_string());

    Ok(WorkspaceInfo {
        path: path.to_string_lossy().to_string(),
        name,
        is_git_repo: true,
    })
}

/// List all workspaces (git repos) in a parent directory
#[command]
pub async fn list_workspaces(parent_path: String) -> Result<Vec<WorkspaceInfo>, String> {
    let parent = PathBuf::from(&parent_path);

    if !parent.exists() {
        return Ok(vec![]);
    }

    let mut workspaces = Vec::new();

    let entries = fs::read_dir(&parent).map_err(|e| e.to_string())?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            let is_git = Repository::discover(&path).is_ok();
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unnamed".to_string());

            workspaces.push(WorkspaceInfo {
                path: path.to_string_lossy().to_string(),
                name,
                is_git_repo: is_git,
            });
        }
    }

    // Sort by name
    workspaces.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(workspaces)
}

/// Create a new project in a workspace
#[command]
pub async fn create_project(
    workspace_path: String,
    project_name: String,
) -> Result<ProjectInfo, String> {
    let workspace = PathBuf::from(&workspace_path);
    let project_dir = workspace.join(&project_name);
    let project_file = project_dir.join(format!("{}.scenex", project_name));

    // Create project directory
    fs::create_dir_all(&project_dir)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create initial project file with empty scenes
    let initial_project = serde_json::json!({
        "id": uuid::Uuid::new_v4().to_string(),
        "name": project_name,
        "created_at": chrono::Local::now().to_rfc3339(),
        "updated_at": chrono::Local::now().to_rfc3339(),
        "scenes": []
    });

    let json = serde_json::to_string_pretty(&initial_project)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    fs::write(&project_file, json).map_err(|e| format!("Failed to write project file: {}", e))?;

    // Git add and commit
    let repo = Repository::discover(&workspace)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    // Add the project file
    let relative_path = project_file.strip_prefix(&workspace).map_err(|e| e.to_string())?;
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

/// List all projects in a workspace
#[command]
pub async fn list_projects(workspace_path: String) -> Result<Vec<ProjectInfo>, String> {
    let workspace = PathBuf::from(&workspace_path);

    if !workspace.exists() {
        return Ok(vec![]);
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(&workspace).map_err(|e| e.to_string())?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            // Look for .scenex file in the directory
            let dir_name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            let project_file = path.join(format!("{}.scenex", dir_name));

            if project_file.exists() {
                let metadata = fs::metadata(&project_file).ok();
                let modified_at = metadata.and_then(|m| m.modified().ok()).map(|t| {
                    let datetime: chrono::DateTime<chrono::Local> = t.into();
                    datetime.to_rfc3339()
                });

                projects.push(ProjectInfo {
                    path: path.to_string_lossy().to_string(),
                    name: dir_name,
                    file_path: project_file.to_string_lossy().to_string(),
                    modified_at,
                });
            }
        }
    }

    // Sort by name
    projects.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(projects)
}

/// Perform git auto-commit for a project
#[command]
pub async fn git_auto_commit(
    workspace_path: String,
    project_name: String,
    message: String,
) -> Result<String, String> {
    let workspace = PathBuf::from(&workspace_path);
    let project_file = workspace
        .join(&project_name)
        .join(format!("{}.scenex", project_name));

    if !project_file.exists() {
        return Err(format!("Project file not found: {}", project_file.display()));
    }

    let repo = Repository::discover(&workspace)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    // Add the project file
    let relative_path = project_file.strip_prefix(&workspace).map_err(|e| e.to_string())?;
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
