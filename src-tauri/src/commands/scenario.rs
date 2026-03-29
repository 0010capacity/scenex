//! Scenario-related AI commands.

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

use super::prompts;

/// Run Claude CLI and return the output
/// Note: Does NOT use --output-format json because that triggers tool-use mode
/// which causes the model to return skill_calls instead of direct JSON.
fn run_claude_json(prompt: &str) -> Result<String, String> {
    let claude_path = which::which("claude").map_err(|_| "Claude CLI not found".to_string())?;

    let output = Command::new(&claude_path)
        .arg("--print")
        .arg(prompt)
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let response = String::from_utf8_lossy(&output.stdout).to_string();
    let trimmed = response.trim();

    // Try to extract JSON from markdown code fence
    if let Some(json_str) = extract_json(trimmed) {
        return Ok(json_str);
    }

    // Fallback: if response itself looks like JSON
    if trimmed.starts_with('{') || trimmed.starts_with('[') {
        return Ok(trimmed.to_string());
    }

    Err(format!("Failed to find JSON in response. Snippet: {}", &trimmed[..trimmed.len().min(200)]))
}

/// Extract JSON from text that may be wrapped in markdown code fences
fn extract_json(text: &str) -> Option<String> {
    let trimmed = text.trim();

    // Try ```json ... ``` pattern
    if let Some(start) = trimmed.find("```json") {
        let after = &trimmed[start + 7..];
        if let Some(end) = after.find("```") {
            return Some(after[..end].trim().to_string());
        }
    }

    // Try generic ``` ... ``` pattern
    if let Some(start) = trimmed.find("```") {
        let after = &trimmed[start + 3..];
        if let Some(end) = after.find("```") {
            let content = after[..end].trim();
            if content.starts_with('{') || content.starts_with('[') {
                return Some(content.to_string());
            }
        }
    }

    // Try raw JSON
    if trimmed.starts_with('{') || trimmed.starts_with('[') {
        return Some(trimmed.to_string());
    }

    None
}

/// Extract SVG content from a string
fn extract_svg(text: &str) -> Option<String> {
    // First try to find direct SVG
    if let Some(start) = text.find("<svg") {
        if let Some(end) = text.find("</svg>") {
            return Some(text[start..end + 6].to_string());
        }
    }

    // Try to find SVG in JSON-wrapped response
    if let Some(json_str) = extract_json(text) {
        // Try to parse as JSON and look for svg field
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
            // Check various possible field names
            for field in ["svg", "svg_data", "svgData", "image"] {
                if let Some(svg) = json.get(field).and_then(|v| v.as_str()) {
                    if svg.contains("<svg") {
                        if let Some(start) = svg.find("<svg") {
                            if let Some(end) = svg.find("</svg>") {
                                return Some(svg[start..end + 6].to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateScenarioRequest {
    pub concept: String,
    pub genre: Option<String>,
    pub mood: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioOutput {
    pub title: String,
    pub logline: String,
    pub acts: Vec<ActOutput>,
    pub estimated_duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActOutput {
    pub name: String,
    pub synopsis: String,
    pub scenes: Vec<SceneOutput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SceneOutput {
    pub name: String,
    pub slugline: String,
    pub description: String,
    pub characters: Vec<String>,
    pub duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateScenarioResponse {
    pub success: bool,
    pub scenario: Option<ScenarioOutput>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioPolisherRequest {
    pub scenario_json: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioResponse {
    pub success: bool,
    pub scenario: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioToStoryboardRequest {
    pub scenario_json: String,
    pub panel_count: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PanelOutput {
    pub scene_index: usize,
    pub scene_name: String,
    pub description: String,
    pub shot_type: String,
    pub duration: String,
    pub mood: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioToStoryboardResponse {
    pub success: bool,
    pub panels: Option<Vec<PanelOutput>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegeneratePanelRequest {
    pub previous_svg: String,
    pub previous_description: String,
    pub user_feedback: String,
    pub scene_context: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegeneratePanelResponse {
    pub success: bool,
    pub svg_data: Option<String>,
    pub error: Option<String>,
}

/// Generate a scenario from a concept
#[command]
pub fn generate_scenario(request: GenerateScenarioRequest) -> GenerateScenarioResponse {
    let prompt = prompts::scenario_generate::build(
        &request.concept,
        request.genre.as_deref(),
        request.mood.as_deref(),
    );

    match run_claude_json(&prompt) {
        Ok(json_str) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json) => GenerateScenarioResponse {
                    success: true,
                    scenario: serde_json::from_value(json).ok(),
                    error: None,
                },
                Err(e) => GenerateScenarioResponse {
                    success: false,
                    scenario: None,
                    error: Some(format!("Failed to parse response: {}. JSON snippet: {}", e, &json_str[..json_str.len().min(100)])),
                },
            }
        }
        Err(e) => GenerateScenarioResponse {
            success: false,
            scenario: None,
            error: Some(e),
        },
    }
}

/// Polish/improve a scenario
#[command]
pub fn scenario_polish(request: ScenarioPolisherRequest) -> ScenarioResponse {
    let prompt = prompts::scenario_polish::build(&request.scenario_json);

    match run_claude_json(&prompt) {
        Ok(json_str) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json) => ScenarioResponse {
                    success: true,
                    scenario: Some(json),
                    error: None,
                },
                Err(e) => ScenarioResponse {
                    success: false,
                    scenario: None,
                    error: Some(format!("Failed to parse response: {}", e)),
                },
            }
        }
        Err(e) => ScenarioResponse {
            success: false,
            scenario: None,
            error: Some(e),
        },
    }
}

/// Expand a scenario
#[command]
pub fn scenario_expand(request: ScenarioPolisherRequest) -> ScenarioResponse {
    let prompt = prompts::scenario_expand::build(&request.scenario_json, "add more scenes per act");

    match run_claude_json(&prompt) {
        Ok(json_str) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json) => ScenarioResponse {
                    success: true,
                    scenario: Some(json),
                    error: None,
                },
                Err(e) => ScenarioResponse {
                    success: false,
                    scenario: None,
                    error: Some(format!("Failed to parse response: {}", e)),
                },
            }
        }
        Err(e) => ScenarioResponse {
            success: false,
            scenario: None,
            error: Some(e),
        },
    }
}

/// Condense a scenario
#[command]
pub fn scenario_condense(request: ScenarioPolisherRequest) -> ScenarioResponse {
    let prompt = prompts::scenario_condense::build(&request.scenario_json, "50% shorter");

    match run_claude_json(&prompt) {
        Ok(json_str) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json) => ScenarioResponse {
                    success: true,
                    scenario: Some(json),
                    error: None,
                },
                Err(e) => ScenarioResponse {
                    success: false,
                    scenario: None,
                    error: Some(format!("Failed to parse response: {}", e)),
                },
            }
        }
        Err(e) => ScenarioResponse {
            success: false,
            scenario: None,
            error: Some(e),
        },
    }
}

/// Convert scenario to storyboard panels
#[command]
pub fn scenario_to_storyboard(request: ScenarioToStoryboardRequest) -> ScenarioToStoryboardResponse {
    let panel_count = request.panel_count.unwrap_or(12);

    let distribution = "Act 1 | 3 | 4\nAct 2 | 4 | 5\nAct 3 | 3 | 3".to_string();

    let prompt = prompts::scenario_to_storyboard::build(
        &request.scenario_json,
        panel_count,
        &distribution,
    );

    match run_claude_json(&prompt) {
        Ok(json_str) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json) => {
                    let panels: Vec<PanelOutput> = json["panels"]
                        .as_array()
                        .map(|arr| {
                            arr.iter()
                                .filter_map(|p| {
                                    Some(PanelOutput {
                                        scene_index: p["sceneIndex"].as_u64()? as usize,
                                        scene_name: p["sceneName"].as_str()?.to_string(),
                                        description: p["description"].as_str()?.to_string(),
                                        shot_type: p["shotType"].as_str().unwrap_or("WS").to_string(),
                                        duration: p["duration"].as_str().unwrap_or("3s").to_string(),
                                        mood: p["mood"].as_str().unwrap_or("neutral").to_string(),
                                    })
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    ScenarioToStoryboardResponse {
                        success: true,
                        panels: Some(panels),
                        error: None,
                    }
                }
                Err(e) => ScenarioToStoryboardResponse {
                    success: false,
                    panels: None,
                    error: Some(format!("Failed to parse panels: {}", e)),
                },
            }
        }
        Err(e) => ScenarioToStoryboardResponse {
            success: false,
            panels: None,
            error: Some(e),
        },
    }
}

/// Regenerate a panel based on user feedback
#[command]
pub fn regenerate_panel(request: RegeneratePanelRequest) -> RegeneratePanelResponse {
    let prompt = prompts::regenerate_panel::build(
        &request.previous_svg,
        &request.previous_description,
        &request.user_feedback,
        request.scene_context.as_deref(),
    );

    match run_claude_json(&prompt) {
        Ok(output) => {
            let svg_data = extract_svg(&output);
            let has_svg = svg_data.is_some();
            RegeneratePanelResponse {
                success: has_svg,
                svg_data,
                error: if has_svg { None } else { Some("No SVG found in response".to_string()) },
            }
        }
        Err(e) => RegeneratePanelResponse {
            success: false,
            svg_data: None,
            error: Some(e),
        },
    }
}
