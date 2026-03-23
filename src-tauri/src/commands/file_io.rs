use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub scenes: serde_json::Value,
}

/// Save project to a file
#[command]
pub async fn save_project(path: String, project: ProjectData) -> Result<(), String> {
    let path = PathBuf::from(&path);

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Serialize project to JSON
    let json = serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?;

    // Write to file
    fs::write(&path, json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Load project from a file
#[command]
pub async fn load_project(path: String) -> Result<ProjectData, String> {
    let path = PathBuf::from(&path);

    // Check if file exists
    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    // Read file content
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    // Parse JSON
    let project: ProjectData =
        serde_json::from_str(&content).map_err(|e| format!("Invalid project file: {}", e))?;

    Ok(project)
}

/// Get default projects directory
#[command]
pub async fn get_default_projects_dir() -> Result<String, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not find home directory")?;
    let projects_dir = PathBuf::from(home)
        .join("Documents")
        .join("SceneX Projects");

    // Create directory if it doesn't exist
    fs::create_dir_all(&projects_dir).map_err(|e| e.to_string())?;

    Ok(projects_dir.to_string_lossy().to_string())
}
