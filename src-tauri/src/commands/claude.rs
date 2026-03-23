use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeStatus {
    available: bool,
    version: Option<String>,
    path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePanelRequest {
    pub description: String,
    pub shot_type: Option<String>,
    pub mood_tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePanelResponse {
    pub svg_data: Option<String>,
    pub description: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Check if Claude CLI is available on the system
#[command]
pub async fn check_claude_available() -> ClaudeStatus {
    // Try to find claude in PATH
    match which::which("claude") {
        Ok(path) => {
            // Try to get version
            let version = Command::new(&path)
                .arg("--version")
                .output()
                .ok()
                .and_then(|output| {
                    let v = String::from_utf8_lossy(&output.stdout).to_string();
                    Some(v.trim().to_string())
                });

            ClaudeStatus {
                available: true,
                version,
                path: Some(path.to_string_lossy().to_string()),
            }
        }
        Err(_) => ClaudeStatus {
            available: false,
            version: None,
            path: None,
        },
    }
}

/// Generate a panel using Claude CLI
#[command]
pub async fn generate_panel(request: GeneratePanelRequest) -> GeneratePanelResponse {
    // Build the prompt for Claude
    let mood_str = if request.mood_tags.is_empty() {
        "neutral".to_string()
    } else {
        request.mood_tags.join(", ")
    };

    let shot_str = request.shot_type.unwrap_or_else(|| "medium shot".to_string());

    let prompt = format!(
        r#"Generate a simple SVG storyboard sketch for the following scene:

Description: {}
Shot type: {}
Mood: {}

Create a minimalist, sketch-style SVG (16:9 aspect ratio, viewBox="0 0 640 360") that captures the essence of this shot.
Use simple shapes and minimal detail. Style should be like a rough pencil sketch with dark strokes on light background.
Output only the SVG code, no explanation."#,
        request.description, shot_str, mood_str
    );

    // Try to run Claude CLI
    match which::which("claude") {
        Ok(claude_path) => {
            let output = Command::new(&claude_path)
                .arg("--print")
                .arg(&prompt)
                .output();

            match output {
                Ok(output) => {
                    if output.status.success() {
                        let response = String::from_utf8_lossy(&output.stdout).to_string();

                        // Extract SVG from response
                        let svg_data = extract_svg(&response);

                        GeneratePanelResponse {
                            svg_data,
                            description: request.description.clone(),
                            success: true,
                            error: None,
                        }
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr).to_string();
                        GeneratePanelResponse {
                            svg_data: None,
                            description: request.description,
                            success: false,
                            error: Some(error),
                        }
                    }
                }
                Err(e) => GeneratePanelResponse {
                    svg_data: None,
                    description: request.description,
                    success: false,
                    error: Some(format!("Failed to execute Claude: {}", e)),
                },
            }
        }
        Err(_) => GeneratePanelResponse {
            svg_data: None,
            description: request.description,
            success: false,
            error: Some("Claude CLI not found. Please install Claude Code CLI.".to_string()),
        },
    }
}

/// Extract SVG content from a string
fn extract_svg(text: &str) -> Option<String> {
    // Try to find SVG tags
    if let Some(start) = text.find("<svg") {
        if let Some(end) = text.find("</svg>") {
            let end = end + 6; // Include closing tag
            return Some(text[start..end].to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_svg() {
        let text = r#"Here's the SVG: <svg viewBox="0 0 100 100"><rect/></svg> Done"#;
        let result = extract_svg(text);
        assert!(result.is_some());
        assert!(result.unwrap().starts_with("<svg"));
    }
}
