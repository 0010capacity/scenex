mod commands;
mod error;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            commands::claude::check_claude_available,
            commands::claude::generate_panel,
            commands::claude::generate_script_lines,
            commands::claude::generate_description_suggestion,
            commands::claude::batch_generate_panels,
            commands::scenario::generate_scenario,
            commands::scenario::scenario_polish,
            commands::scenario::scenario_expand,
            commands::scenario::scenario_condense,
            commands::scenario::scenario_to_storyboard,
            commands::scenario::regenerate_panel,
            commands::versioning::compare_versions,
            commands::file_io::save_project,
            commands::file_io::load_project,
            commands::export::export_pdf,
            commands::export::export_images,
            commands::export::export_fcp_xml,
            commands::export::export_premiere_xml,
            commands::workspace::create_project,
            commands::workspace::git_auto_commit,
            commands::checkpoints::create_scenario_checkpoint,
            commands::checkpoints::restore_scenario_checkpoint,
            commands::checkpoints::list_scenario_checkpoints,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
