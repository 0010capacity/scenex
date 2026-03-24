//! Version comparison commands.

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

use super::prompts;

/// Run Claude CLI and return the output
fn run_claude(prompt: &str) -> Result<String, String> {
    let claude_path = which::which("claude").map_err(|_| "Claude CLI not found".to_string())?;

    let output = Command::new(&claude_path)
        .arg("--print")
        .arg(prompt)
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompareVersionsRequest {
    pub version_a: String,
    pub desc_a: Option<String>,
    pub version_b: String,
    pub desc_b: Option<String>,
    pub comparison_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompareVersionsResponse {
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Compare two panel or scenario versions
#[command]
pub fn compare_versions(request: CompareVersionsRequest) -> CompareVersionsResponse {
    let prompt = if request.comparison_type == "panel" {
        prompts::panel_compare::build(
            &request.version_a,
            request.desc_a.as_deref().unwrap_or(""),
            &request.version_b,
            request.desc_b.as_deref().unwrap_or(""),
        )
    } else {
        prompts::scenario_compare::build(&request.version_a, &request.version_b)
    };

    match run_claude(&prompt) {
        Ok(output) => {
            let cleaned = output.trim();
            match serde_json::from_str::<serde_json::Value>(cleaned) {
                Ok(json) => CompareVersionsResponse {
                    success: true,
                    result: Some(json),
                    error: None,
                },
                Err(e) => CompareVersionsResponse {
                    success: false,
                    result: None,
                    error: Some(format!("Failed to parse response: {}", e)),
                },
            }
        }
        Err(e) => CompareVersionsResponse {
            success: false,
            result: None,
            error: Some(e),
        },
    }
}
