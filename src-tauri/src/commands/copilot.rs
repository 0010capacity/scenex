use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

/// Context information sent from frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct CopilotContext {
    pub mode: String,
    pub selected_scene_id: Option<String>,
    pub selected_scene_name: Option<String>,
    pub panel_count: Option<usize>,
    pub selected_panel_id: Option<String>,
    pub selected_panel_number: Option<usize>,
    pub panel_shot_type: Option<String>,
    pub panel_description: Option<String>,
    pub panel_duration: Option<String>,
    pub panel_mood_tags: Option<Vec<String>>,
    // Scenario context
    pub selected_scenario_id: Option<String>,
    pub selected_scenario_name: Option<String>,
    pub scenario_description: Option<String>,
    pub scenario_content: Option<String>,
}

/// Chat message for history
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Request to copilot chat
#[derive(Debug, Serialize, Deserialize)]
pub struct CopilotChatRequest {
    pub message: String,
    pub context: CopilotContext,
    #[serde(default)]
    pub history: Vec<ChatMessage>,
}

/// Copilot response with skill calls
#[derive(Debug, Serialize, Deserialize)]
pub struct CopilotSkillCall {
    pub skill: String,
    pub tool: String,
    #[serde(alias = "params")]
    pub parameters: serde_json::Value,
}

/// Copilot response
#[derive(Debug, Serialize, Deserialize)]
pub struct CopilotResponse {
    #[serde(default)]
    pub thinking: String,
    #[serde(default)]
    pub skill_calls: Vec<CopilotSkillCall>,
    #[serde(default)]
    pub message: String,
}

/// Copilot chat response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct CopilotChatResponse {
    pub success: bool,
    pub response: Option<CopilotResponse>,
    pub error: Option<String>,
}

/// Build the copilot prompt with context and history
fn build_prompt(message: &str, ctx: &CopilotContext, history: &[ChatMessage]) -> String {
    // Load mode-specific prompt
    let template = match ctx.mode.as_str() {
        "storyboard" => include_str!("../../prompts/copilot_storyboard.md"),
        "scenario" => include_str!("../../prompts/copilot_scenario.md"),
        _ => include_str!("../../prompts/copilot_scenario.md"), // default to scenario
    };

    // Build conversation history section
    let history_section = if history.is_empty() {
        String::new()
    } else {
        let history_lines: Vec<String> = history
            .iter()
            .map(|msg| format!("- [{}]: {}", msg.role, msg.content))
            .collect();
        format!("\n## Previous Conversation\n{}\n", history_lines.join("\n"))
    };

    template
        .replace("{{mode}}", &ctx.mode)
        .replace("{{selected_scene_id}}", ctx.selected_scene_id.as_deref().unwrap_or("none"))
        .replace("{{selected_scene_name}}", ctx.selected_scene_name.as_deref().unwrap_or("none"))
        .replace("{{panel_count}}", &ctx.panel_count.map(|n| n.to_string()).unwrap_or_else(|| "0".to_string()))
        .replace("{{selected_panel_id}}", ctx.selected_panel_id.as_deref().unwrap_or("none"))
        .replace("{{selected_panel_number}}", &ctx.selected_panel_number.map(|n| n.to_string()).unwrap_or_else(|| "none".to_string()))
        .replace("{{panel_shot_type}}", ctx.panel_shot_type.as_deref().unwrap_or("not set"))
        .replace("{{panel_description}}", ctx.panel_description.as_deref().unwrap_or("empty"))
        .replace("{{panel_duration}}", ctx.panel_duration.as_deref().unwrap_or("not set"))
        .replace("{{panel_mood_tags}}", &ctx.panel_mood_tags.as_ref().map(|t| t.join(", ")).unwrap_or_else(|| "none".to_string()))
        // Scenario context
        .replace("{{selected_scenario_id}}", ctx.selected_scenario_id.as_deref().unwrap_or("none"))
        .replace("{{selected_scenario_name}}", ctx.selected_scenario_name.as_deref().unwrap_or("none"))
        .replace("{{scenario_description}}", ctx.scenario_description.as_deref().unwrap_or("empty"))
        .replace("{{scenario_content}}", ctx.scenario_content.as_deref().unwrap_or("(시나리오 내용이 없습니다)"))
        .replace("{{conversation_history}}", &history_section)
        .replace("{{user_message}}", message)
}

/// Parse copilot response from JSON
fn parse_response(text: &str) -> Result<CopilotResponse, String> {
    // Try to find JSON object in response
    let json_str = extract_json_object(text)
        .ok_or_else(|| {
            // Include a snippet of the raw response for debugging
            let snippet = text.chars().take(200).collect::<String>();
            format!("Failed to find JSON object in response. Snippet: {}", snippet)
        })?;

    let response: CopilotResponse = serde_json::from_str(&json_str)
        .map_err(|e| {
            let snippet = json_str.chars().take(100).collect::<String>();
            format!("JSON parse error: {}. Snippet: {}", e, snippet)
        })?;

    Ok(response)
}

/// Extract JSON object from text, handling markdown fences
fn extract_json_object(text: &str) -> Option<String> {
    let trimmed = text.trim();

    // Strategy 1: Try to extract from markdown code fence
    if let Some(json) = extract_from_markdown_fence(trimmed) {
        return Some(json);
    }

    // Strategy 2: Find JSON object with brace matching
    extract_with_brace_matching(trimmed)
}

/// Extract JSON from markdown code fence (```json ... ```)
fn extract_from_markdown_fence(text: &str) -> Option<String> {
    // Look for ```json ... ``` pattern
    if let Some(start) = text.find("```json") {
        let after_fence = &text[start + 7..]; // Skip "```json"
        if let Some(content_start) = after_fence.find('\n') {
            let content = &after_fence[content_start + 1..];
            if let Some(end) = content.find("```") {
                return Some(content[..end].trim().to_string());
            }
        }
    }

    // Also try generic ``` ... ``` pattern
    if let Some(start) = text.find("```") {
        let after_fence = &text[start + 3..];
        // Skip language identifier if present
        let content_start = after_fence.find('\n')?;
        let content = &after_fence[content_start + 1..];
        if let Some(end) = content.find("```") {
            let extracted = content[..end].trim();
            // Verify it looks like JSON
            if extracted.starts_with('{') {
                return Some(extracted.to_string());
            }
        }
    }

    None
}

/// Original brace matching logic
fn extract_with_brace_matching(text: &str) -> Option<String> {
    let start = text.find('{')?;
    let mut depth = 0;
    let mut end = start;

    for (byte_idx, c) in text[start..].char_indices() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = start + byte_idx + c.len_utf8();
                    break;
                }
            }
            _ => {}
        }
    }
    Some(text[start..end].to_string())
}

/// Copilot chat command
#[command]
pub async fn copilot_chat(request: CopilotChatRequest) -> CopilotChatResponse {
    // Build prompt with context and history
    let prompt = build_prompt(&request.message, &request.context, &request.history);

    // Try to run Claude CLI
    match which::which("claude") {
        Ok(claude_path) => {
            let output = Command::new(&claude_path)
                .arg("--print")
                .arg("--output-format")
                .arg("json")
                .arg(&prompt)
                .output();

            match output {
                Ok(output) => {
                    if output.status.success() {
                        let response = String::from_utf8_lossy(&output.stdout).to_string();
                        eprintln!("[Copilot] Raw response ({} bytes): {:?}", response.len(), response);

                        // Also log stderr if present
                        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                        if !stderr.is_empty() {
                            eprintln!("[Copilot] Stderr: {:?}", stderr);
                        }

                        match parse_response(&response) {
                            Ok(copilot_response) => CopilotChatResponse {
                                success: true,
                                response: Some(copilot_response),
                                error: None,
                            },
                            Err(e) => {
                                eprintln!("[Copilot] Failed to parse response: {}", e);
                                eprintln!("[Copilot] Raw response: {}", response);
                                CopilotChatResponse {
                                    success: false,
                                    response: None,
                                    error: Some(format!("Failed to parse response: {}", e)),
                                }
                            }
                        }
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr).to_string();
                        CopilotChatResponse {
                            success: false,
                            response: None,
                            error: Some(error),
                        }
                    }
                }
                Err(e) => CopilotChatResponse {
                    success: false,
                    response: None,
                    error: Some(format!("Failed to execute Claude: {}", e)),
                },
            }
        }
        Err(_) => CopilotChatResponse {
            success: false,
            response: None,
            error: Some("Claude CLI not found. Please install Claude Code CLI.".to_string()),
        },
    }
}
