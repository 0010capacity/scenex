use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    Runtime,
};

pub fn create_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    // Submenu: App Menu (SceneX)
    let app_menu = SubmenuBuilder::new(app, "SceneX")
        .item(&MenuItemBuilder::with_id("about", "About SceneX").build(app)?)
        .item(&MenuItemBuilder::with_id("preferences", "Preferences...").accelerator("CmdOrCtrl+,").build(app)?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, Some("Hide SceneX"))?)
        .item(&PredefinedMenuItem::hide_others(app, Some("Hide Others"))?)
        .item(&PredefinedMenuItem::show_all(app, Some("Show All"))?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some("Quit SceneX"))?)
        .build()?;

    // Submenu: File Menu
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::with_id("new-project", "New Project").accelerator("CmdOrCtrl+N").build(app)?)
        .item(&MenuItemBuilder::with_id("open", "Open...").accelerator("CmdOrCtrl+O").build(app)?)
        .item(&SubmenuBuilder::new(app, "Open Recent")
            .item(&MenuItemBuilder::with_id("open-recent-clear", "Clear Menu").build(app)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("save", "Save").accelerator("CmdOrCtrl+S").build(app)?)
        .item(&MenuItemBuilder::with_id("save-as", "Save As...").accelerator("CmdOrCtrl+Shift+S").build(app)?)
        .separator()
        .item(&SubmenuBuilder::new(app, "Export")
            .item(&MenuItemBuilder::with_id("export-pdf", "PDF...").build(app)?)
            .item(&MenuItemBuilder::with_id("export-images", "Images...").build(app)?)
            .item(&MenuItemBuilder::with_id("export-fcp-xml", "Final Cut Pro XML...").build(app)?)
            .item(&MenuItemBuilder::with_id("export-premiere-xml", "Premiere Pro XML...").build(app)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("close-project", "Close Project").accelerator("CmdOrCtrl+W").build(app)?)
        .build()?;

    // Submenu: Edit Menu
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, Some("Undo"))?)
        .item(&PredefinedMenuItem::redo(app, Some("Redo"))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
        .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
        .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
        .separator()
        .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
        .separator()
        .item(&MenuItemBuilder::with_id("find-in-scenario", "Find in Scenario...").accelerator("CmdOrCtrl+F").build(app)?)
        .build()?;

    // Submenu: View Menu
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&SubmenuBuilder::new(app, "Workspace Mode")
            .item(&MenuItemBuilder::with_id("view-workspace-scenario", "Scenario").accelerator("CmdOrCtrl+1").build(app)?)
            .item(&MenuItemBuilder::with_id("view-workspace-storyboard", "Storyboard").accelerator("CmdOrCtrl+2").build(app)?)
            .build()?)
        .item(&SubmenuBuilder::new(app, "Panel View")
            .item(&MenuItemBuilder::with_id("view-panel-grid", "Grid").accelerator("CmdOrCtrl+Shift+G").build(app)?)
            .item(&MenuItemBuilder::with_id("view-panel-strip", "Strip").accelerator("CmdOrCtrl+Shift+T").build(app)?)
            .item(&MenuItemBuilder::with_id("view-panel-slide", "Slide").accelerator("CmdOrCtrl+Shift+L").build(app)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("zoom-in", "Zoom In").accelerator("CmdOrCtrl+=").build(app)?)
        .item(&MenuItemBuilder::with_id("zoom-out", "Zoom Out").accelerator("CmdOrCtrl+-").build(app)?)
        .item(&MenuItemBuilder::with_id("zoom-reset", "Reset Zoom").accelerator("CmdOrCtrl+0").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("toggle-inspector", "Toggle Inspector").accelerator("CmdOrCtrl+I").build(app)?)
        .item(&MenuItemBuilder::with_id("toggle-copilot", "Toggle AI Copilot").accelerator("CmdOrCtrl+Shift+C").build(app)?)
        .build()?;

    // Submenu: Window Menu
    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&PredefinedMenuItem::minimize(app, Some("Minimize"))?)
        .item(&PredefinedMenuItem::fullscreen(app, Some("Fullscreen"))?)
        .build()?;

    // Submenu: Help Menu
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&MenuItemBuilder::with_id("help-sceneX", "SceneX Help").build(app)?)
        .item(&MenuItemBuilder::with_id("help-shortcuts", "Keyboard Shortcuts").build(app)?)
        .build()?;

    // Build the full menu
    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()?;

    Ok(menu)
}
