use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

use super::result::CommandResult;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub id: String,
    pub name: String,
    #[serde(rename = "createdAt", alias = "created_at")]
    pub created_at: String,
    #[serde(rename = "updatedAt", alias = "updated_at")]
    pub updated_at: String,
    pub scenario: ScenarioData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioData {
    pub content: String,
    pub scenes: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct SaveProjectResponse {
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadProjectResponse {
    pub project: ProjectData,
}

/// Save project to a file
#[command]
pub async fn save_project(path: String, project: ProjectData) -> CommandResult<SaveProjectResponse> {
    let path_buf = PathBuf::from(&path);

    // Ensure parent directory exists
    if let Some(parent) = path_buf.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return CommandResult::err_with_details(
                crate::error::ErrorCode::ProjectSaveFailed,
                "Failed to create project directory",
                e.to_string(),
            );
        }
    }

    // Serialize project to JSON
    let json = match serde_json::to_string_pretty(&project) {
        Ok(j) => j,
        Err(e) => {
            return CommandResult::err_with_details(
                crate::error::ErrorCode::ValidationFailed,
                "Failed to serialize project",
                e.to_string(),
            );
        }
    };

    // Write to file
    if let Err(e) = fs::write(&path_buf, json) {
        return CommandResult::err_with_details(
            crate::error::ErrorCode::ProjectSaveFailed,
            "Failed to save project file",
            e.to_string(),
        );
    }

    CommandResult::ok(SaveProjectResponse { path })
}

/// Load project from a file
#[command]
pub async fn load_project(path: String) -> CommandResult<LoadProjectResponse> {
    eprintln!("[DEBUG] load_project called with path: {}", path);
    let path_buf = PathBuf::from(&path);
    eprintln!("[DEBUG] load_project: path_buf={}, exists={}", path_buf.display(), path_buf.exists());

    // Check if file exists
    if !path_buf.exists() {
        return CommandResult::err(
            crate::error::ErrorCode::ProjectNotFound,
            format!("Project file not found: {}", path_buf.display()),
        );
    }

    // Read file content
    let content = match fs::read_to_string(&path_buf) {
        Ok(c) => c,
        Err(e) => {
            return CommandResult::err_with_details(
                crate::error::ErrorCode::ProjectLoadFailed,
                "Failed to read project file",
                e.to_string(),
            );
        }
    };

    // Parse JSON
    let project = match serde_json::from_str::<ProjectData>(&content) {
        Ok(p) => p,
        Err(e) => {
            return CommandResult::err_with_details(
                crate::error::ErrorCode::ValidationFailed,
                "Invalid project file format",
                e.to_string(),
            );
        }
    };

    CommandResult::ok(LoadProjectResponse { project })
}

