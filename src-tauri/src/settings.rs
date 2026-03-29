use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub version: u32,
    pub ai: AISettings,
    pub appearance: AppearanceSettings,
    pub project: ProjectSettings,
    pub editor: EditorSettings,
    pub shortcuts: ShortcutSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AISettings {
    pub claude_cli_path: String,
    pub response_language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    pub theme: String, // "light" | "dark" | "system"
    pub font_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub auto_save_interval: u32,
    pub auto_git_commit: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorSettings {
    pub default_workspace_mode: String, // "scenario" | "storyboard"
    pub default_panel_view: String,     // "grid" | "strip" | "slide"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutSettings {
    pub custom_shortcuts: std::collections::HashMap<String, String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: 1,
            ai: AISettings {
                claude_cli_path: "/usr/local/bin/claude".to_string(),
                response_language: "ko".to_string(),
            },
            appearance: AppearanceSettings {
                theme: "system".to_string(),
                font_size: 14,
            },
            project: ProjectSettings {
                auto_save_interval: 30,
                auto_git_commit: true,
            },
            editor: EditorSettings {
                default_workspace_mode: "scenario".to_string(),
                default_panel_view: "grid".to_string(),
            },
            shortcuts: ShortcutSettings {
                custom_shortcuts: std::collections::HashMap::new(),
            },
        }
    }
}

#[command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let settings = store.get("settings");
    match settings {
        Some(s) => Ok(serde_json::from_value(s.clone()).map_err(|e| e.to_string())?),
        None => Ok(Settings::default()),
    }
}

#[command]
pub async fn set_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let value = serde_json::to_value(&settings).map_err(|e| e.to_string())?;
    store.set("settings", value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
