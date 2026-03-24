use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

use super::prompts;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateScriptLinesRequest {
    pub slugline: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptLineDto {
    pub line_type: String,
    pub text: String,
    pub character: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateScriptLinesResponse {
    pub script_lines: Vec<ScriptLineDto>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateDescriptionSuggestionRequest {
    pub current_description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateDescriptionSuggestionResponse {
    pub suggestion: Option<String>,
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
    // Build prompt using template
    let prompt = prompts::svg_panel::build(
        &request.description,
        request.shot_type.as_deref(),
        &request.mood_tags,
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

/// Generate script lines based on a slugline using Claude CLI
#[command]
pub async fn generate_script_lines(request: GenerateScriptLinesRequest) -> GenerateScriptLinesResponse {
    // Build prompt using template
    let prompt = prompts::script_lines::build(&request.slugline);

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
                        let script_lines = parse_script_lines(&response);
                        GenerateScriptLinesResponse {
                            script_lines,
                            success: true,
                            error: None,
                        }
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr).to_string();
                        GenerateScriptLinesResponse {
                            script_lines: vec![],
                            success: false,
                            error: Some(error),
                        }
                    }
                }
                Err(e) => GenerateScriptLinesResponse {
                    script_lines: vec![],
                    success: false,
                    error: Some(format!("Failed to execute Claude: {}", e)),
                },
            }
        }
        Err(_) => GenerateScriptLinesResponse {
            script_lines: vec![],
            success: false,
            error: Some("Claude CLI not found. Please install Claude Code CLI.".to_string()),
        },
    }
}

/// Parse script lines from JSON response
fn parse_script_lines(text: &str) -> Vec<ScriptLineDto> {
    // Try to find JSON array in response
    let json_str = extract_json_array(text);
    if let Some(json_str) = json_str {
        if let Ok(lines) = serde_json::from_str::<Vec<ScriptLineDto>>(&json_str) {
            return lines;
        }
    }
    vec![]
}

/// Extract JSON array from text
fn extract_json_array(text: &str) -> Option<String> {
    // Look for array start
    let start = text.find('[')?;
    // Look for array end (last matching bracket)
    let mut depth = 0;
    let mut end = start;
    for (i, c) in text[start..].chars().enumerate() {
        match c {
            '[' => depth += 1,
            ']' => {
                depth -= 1;
                if depth == 0 {
                    end = start + i + 1;
                    break;
                }
            }
            _ => {}
        }
    }
    Some(text[start..end].to_string())
}

/// Generate an improved description suggestion using Claude CLI
#[command]
pub async fn generate_description_suggestion(
    request: GenerateDescriptionSuggestionRequest,
) -> GenerateDescriptionSuggestionResponse {
    // Build prompt using template
    let prompt = prompts::description_enhance::build(&request.current_description);

    match which::which("claude") {
        Ok(claude_path) => {
            let output = Command::new(&claude_path)
                .arg("--print")
                .arg(&prompt)
                .output();

            match output {
                Ok(output) => {
                    if output.status.success() {
                        let suggestion = String::from_utf8_lossy(&output.stdout)
                            .trim()
                            .to_string();
                        GenerateDescriptionSuggestionResponse {
                            suggestion: Some(suggestion),
                            success: true,
                            error: None,
                        }
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr).to_string();
                        GenerateDescriptionSuggestionResponse {
                            suggestion: None,
                            success: false,
                            error: Some(error),
                        }
                    }
                }
                Err(e) => GenerateDescriptionSuggestionResponse {
                    suggestion: None,
                    success: false,
                    error: Some(format!("Failed to execute Claude: {}", e)),
                },
            }
        }
        Err(_) => GenerateDescriptionSuggestionResponse {
            suggestion: None,
            success: false,
            error: Some("Claude CLI not found. Please install Claude Code CLI.".to_string()),
        },
    }
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

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchGenerateRequest {
    pub scene_description: String,
    pub shot_type_hint: Option<String>,
    pub mood_tags: Vec<String>,
    pub panel_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedPanel {
    pub description: String,
    pub shot_type: String,
    pub duration: String,
    pub svg_data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchGenerateResponse {
    pub panels: Vec<GeneratedPanel>,
    pub success: bool,
    pub error: Option<String>,
}

/// Batch generate multiple panels for a scene using Claude CLI
#[command]
pub async fn batch_generate_panels(request: BatchGenerateRequest) -> BatchGenerateResponse {
    let panel_count = request.panel_count.clamp(2, 8);

    // Build prompt using template
    let prompt = prompts::batch_panels::build(
        &request.scene_description,
        request.shot_type_hint.as_deref(),
        &request.mood_tags,
        panel_count,
    );

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
                        match parse_batch_response(&response) {
                            Ok(panels) => BatchGenerateResponse {
                                panels,
                                success: true,
                                error: None,
                            },
                            Err(e) => BatchGenerateResponse {
                                panels: vec![],
                                success: false,
                                error: Some(e),
                            },
                        }
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr).to_string();
                        BatchGenerateResponse {
                            panels: vec![],
                            success: false,
                            error: Some(error),
                        }
                    }
                }
                Err(e) => BatchGenerateResponse {
                    panels: vec![],
                    success: false,
                    error: Some(format!("Failed to execute Claude: {}", e)),
                },
            }
        }
        Err(_) => BatchGenerateResponse {
            panels: vec![],
            success: false,
            error: Some("Claude CLI not found. Please install Claude Code CLI.".to_string()),
        },
    }
}

/// Parse batch generate response
fn parse_batch_response(text: &str) -> Result<Vec<GeneratedPanel>, String> {
    let json_str = extract_json_object(text).ok_or("Failed to find JSON in response")?;
    #[derive(Deserialize)]
    struct Response {
        panels: Vec<GeneratedPanel>,
    }
    let response: Response =
        serde_json::from_str(&json_str).map_err(|e| format!("Failed to parse JSON: {}", e))?;
    Ok(response.panels)
}

/// Extract JSON object from text
fn extract_json_object(text: &str) -> Option<String> {
    // Look for object start
    let start = text.find('{')?;
    // Find matching closing brace
    let mut depth = 0;
    let mut end = start;
    for (i, c) in text[start..].chars().enumerate() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = start + i + 1;
                    break;
                }
            }
            _ => {}
        }
    }
    Some(text[start..end].to_string())
}
