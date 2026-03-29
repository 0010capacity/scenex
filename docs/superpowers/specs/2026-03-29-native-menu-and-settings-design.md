# Native Menu Bar + Settings Modal Design

**Date**: 2026-03-29
**Status**: Draft
**Author**: Claude

## Overview

macOS 네이티브 메뉴 바를 구성하고, 사이드탭 기반 Settings 모달을 추가한다. 이를 통해 사용자가 키보드 단축키와 표준 macOS 메뉴로 앱을 조작할 수 있게 한다.

## Goals

- macOS 표준 네이티브 메뉴 바 제공 (File, Edit, View, Window, Help)
- 키보드 단축키로 주요 기능 접근
- 사용자 설정을 관리하는 Settings 모달 구현
- 설정 영속화 (앱 재시작 후에도 유지)

## Non-Goals

- Windows/Linux 메뉴 지원 (macOS only for now)
- 메뉴 아이콘 커스터마이즈
- 메뉴 항목의 동적 활성화/비활성화 (초기 버전)

## Menu Structure

### Application Menu (SceneX)

macOS 첫 번째 앱 메뉴. 시스템이 자동으로 앱 이름으로 표시.

| Item | Shortcut | Action |
|------|----------|--------|
| About SceneX | | Show about dialog |
| --- | | |
| Preferences... | ⌘, | Open Settings modal |
| --- | | |
| Hide SceneX | ⌘H | Hide application |
| Hide Others | ⌘⌥H | Hide other applications |
| Show All | | Show all hidden applications |
| --- | | |
| Quit SceneX | ⌘Q | Quit application |

### File Menu

| Item | Shortcut | Event Name | Action |
|------|----------|------------|--------|
| New Project | ⌘N | `menu:new-project` | Create new project with folder picker |
| Open... | ⌘O | `menu:open` | Open .scenex file with file picker |
| Open Recent | → | `menu:open-recent` | Submenu with recent projects (graceful error if file missing) |
| --- | | | |
| Save | ⌘S | `menu:save` | Save current project |
| Save As... | ⌘⇧S | `menu:save-as` | Save with new name/location |
| --- | | | |
| Export | → | | Submenu |
| └ Export as PDF | | `menu:export-pdf` | Export storyboard to PDF |
| └ Export as Images | | `menu:export-images` | Export panels as images |
| └ Export as FCP XML | | `menu:export-fcp` | Export for Final Cut Pro |
| └ Export as Premiere XML | | `menu:export-premiere` | Export for Adobe Premiere |
| --- | | | |
| Close Project | ⌘W | `menu:close` | Close current project |

### Edit Menu

| Item | Shortcut | Event Name | Action |
|------|----------|------------|--------|
| Undo | ⌘Z | `menu:undo` | Undo last action |
| Redo | ⌘⇧Z | `menu:redo` | Redo last undone action |
| --- | | | |
| Cut | ⌘X | `menu:cut` | Cut selection |
| Copy | ⌘C | `menu:copy` | Copy selection |
| Paste | ⌘V | `menu:paste` | Paste from clipboard |
| Select All | ⌘A | `menu:select-all` | Select all |
| --- | | | |
| Find in Scenario | ⌘F | `menu:find` | Focus search in scenario editor |

### View Menu

| Item | Shortcut | Event Name | Action |
|------|----------|------------|--------|
| Workspace Mode | → | | Submenu - switch between main editing modes |
| └ Scenario | ⌘1 | `menu:scenario-mode` | Switch to scenario editor |
| └ Storyboard | ⌘2 | `menu:storyboard-mode` | Switch to storyboard view |
| Panel View | → | | Submenu - change panel display format |
| └ Grid | ⌘⇧G | `menu:grid-view` | Grid layout |
| └ Strip | ⌘⇧T | `menu:strip-view` | Horizontal strip layout |
| └ Slide | ⌘⇧L | `menu:slide-view` | Slide presentation layout |
| --- | | | |
| Zoom In | ⌘+ | `menu:zoom-in` | Increase zoom level |
| Zoom Out | ⌘- | `menu:zoom-out` | Decrease zoom level |
| Reset Zoom | ⌘0 | `menu:zoom-reset` | Reset to 100% |
| --- | | | |
| Toggle Inspector | ⌘I | `menu:toggle-inspector` | Show/hide inspector panel |
| Toggle AI Copilot | ⌘⇧C | `menu:toggle-copilot` | Show/hide AI copilot sidebar |

### Window Menu

| Item | Shortcut | Event Name | Action |
|------|----------|------------|--------|
| Minimize | ⌘M | `menu:minimize` | Minimize window |
| Full Screen | ⌘⌃F | `menu:fullscreen` | Toggle fullscreen |

### Help Menu

| Item | Event Name | Action |
|------|------------|--------|
| SceneX Help | `menu:help` | Open documentation URL |
| Keyboard Shortcuts | `menu:shortcuts` | Show shortcuts reference |
| --- | | |
| About SceneX | `menu:about` | Show about dialog |

## Settings Modal

### UI Structure

```
┌─────────────────────────────────────────────────────┐
│  Settings                                    [X]    │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  AI      │  [Settings content area]                │
│          │                                          │
│  외관    │                                          │
│          │                                          │
│  프로젝트│                                          │
│          │                                          │
│  에디터  │                                          │
│          │                                          │
│  단축키  │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Settings Tabs

#### 1. AI Tab

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Claude CLI Path | string + browse | `/usr/local/bin/claude` | Path to claude CLI binary |
| AI Response Language | radio | `ko` | Language for AI responses (ko/en) |

**Claude CLI Path Validation:**
- On blur/change: check if path exists and is executable
- Show green checkmark ✓ if valid
- Show red error icon ✗ with message if invalid: "Path does not exist" or "File is not executable"
- Disable AI features if path is invalid

#### 2. Appearance Tab (외관)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Theme | radio | `system` | light / dark / system |
| Font Size | slider | `14` | Base font size (12-20) |

#### 3. Project Tab (프로젝트)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Auto-save Interval | number | `30` | Seconds between auto-saves (0 = disabled) |
| Auto Git Commit | toggle | `true` | Automatically commit on save |

**Auto-save Failure Handling:**
- If auto-save fails (permissions, disk full, etc.): show notification toast
- Retry button in toast
- If 3 consecutive failures: pause auto-save and show modal with options

**Open Recent Error Handling:**
- If recent project file is missing: show error dialog
- Options: "Remove from Recent", "Locate File...", "Cancel"
- Remove broken entries automatically if user chooses

#### 4. Editor Tab (에디터)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Default Workspace Mode | radio | `scenario` | scenario / storyboard |
| Default Panel View | radio | `grid` | grid / strip / slide |

#### 5. Shortcuts Tab (단축키)

- List all keyboard shortcuts
- Each row: Action name | Current shortcut | [Edit] button
- Click [Edit] → enters capture mode → press new shortcut
- Conflict detection and warning
- [Reset All] button to restore defaults

### Default Shortcuts

```json
{
  "newProject": "CommandOrControl+N",
  "openProject": "CommandOrControl+O",
  "saveProject": "CommandOrControl+S",
  "saveProjectAs": "CommandOrControl+Shift+S",
  "closeProject": "CommandOrControl+W",
  "undo": "CommandOrControl+Z",
  "redo": "CommandOrControl+Shift+Z",
  "cut": "CommandOrControl+X",
  "copy": "CommandOrControl+C",
  "paste": "CommandOrControl+V",
  "selectAll": "CommandOrControl+A",
  "find": "CommandOrControl+F",
  "scenarioMode": "CommandOrControl+1",
  "storyboardMode": "CommandOrControl+2",
  "gridView": "CommandOrControl+Shift+G",
  "stripView": "CommandOrControl+Shift+S",
  "slideView": "CommandOrControl+Shift+L",
  "zoomIn": "CommandOrControl+Plus",
  "zoomOut": "CommandOrControl+Minus",
  "resetZoom": "CommandOrControl+0",
  "toggleInspector": "CommandOrControl+I",
  "toggleCopilot": "CommandOrControl+Shift+C"
}
```

## Technical Architecture

### Rust Layer

```
src-tauri/
├── src/
│   ├── menu.rs          # Menu definition and event handling
│   ├── settings.rs      # Settings CRUD commands
│   └── lib.rs           # Module registration
```

**menu.rs**:
- Use `tauri::menu::MenuBuilder` to construct menus
- Register accelerators (shortcuts) using `app.handle().add_shortcut()`
- Emit events to frontend via `app.emit("menu:save", None)`
- Handle window controls (minimize, fullscreen) directly in Rust

**settings.rs**:
- Use `tauri-plugin-store` for persistence
- Provide `get_settings` and `set_settings` commands
- Platform-appropriate storage handled by `tauri-plugin-store`:
  - macOS: `~/Library/Application Support/com.scenex/settings.json`
- Settings JSON includes version field for migration:
  ```json
  { "version": 1, "ai": {...}, "appearance": {...}, ... }
  ```

### Frontend Layer

```
src/
├── stores/
│   └── settingsStore.ts           # Zustand store for settings
├── components/
│   └── settings/
│       ├── SettingsModal.tsx      # Main modal container
│       ├── SettingsSidebar.tsx    # Tab navigation
│       ├── AISection.tsx          # AI settings
│       ├── AppearanceSection.tsx  # Theme, font settings
│       ├── ProjectSection.tsx     # Auto-save settings
│       ├── EditorSection.tsx      # Editor defaults
│       └── ShortcutsSection.tsx   # Shortcut customization
├── hooks/
│   └── useMenuEvents.ts           # Listen to menu events from Rust
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action                              │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              macOS Menu Bar (Native)                 │   │
│  │                    │                                 │   │
│  │                    ▼                                 │   │
│  │           Rust: menu.rs                              │   │
│  │           emit("menu:save", None)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Frontend: useMenuEvents.ts                 │   │
│  │           listen("menu:save")                        │   │
│  │                    │                                 │   │
│  │                    ▼                                 │   │
│  │           Call useWorkspace().saveProject()          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Settings Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Modal                            │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           settingsStore.ts (Zustand)                 │   │
│  │                    │                                 │   │
│  │                    ▼                                 │   │
│  │           invoke("set_settings", settings)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Rust: settings.rs                          │   │
│  │           tauri-plugin-store                         │   │
│  │                    │                                 │   │
│  │                    ▼                                 │   │
│  │     ~/Library/Application Support/com.scenex/       │   │
│  │              settings.json (macOS)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Menu Infrastructure
- Add `tauri-plugin-store` dependency
- Create `menu.rs` with basic menu structure
- Create `settings.rs` with get/set commands
- Wire up menu events to frontend

### Phase 2: File Menu Actions
- Implement New, Open, Save, Save As
- Implement Open Recent submenu
- Implement Export submenu

### Phase 3: Edit & View Menu Actions
- Connect Undo/Redo to Zustand stores
- Connect View mode toggles
- Connect Zoom controls

### Phase 4: Settings Modal
- Create SettingsModal component structure
- Implement each settings tab
- Wire up to settingsStore

### Phase 5: Shortcuts Customization
- Implement shortcut capture UI
- Add conflict detection
- Persist custom shortcuts
- **Dynamic shortcut re-registration**:
  - On shortcut change: `app.handle().remove_shortcut(key)` then `app.handle().add_shortcut(new_key, handler)`
  - Store custom shortcuts in settings with version for migration
  - On app start: load custom shortcuts and re-register all

## Dependencies

### Rust (Cargo.toml)
```toml
tauri-plugin-store = "2"
```

### Frontend (package.json)
No new dependencies needed - uses existing:
- Zustand (state)
- Mantine (UI components)
- Tauri API

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Shortcut conflicts with macOS system shortcuts | Reserve system shortcuts, show warning for conflicts |
| Settings migration when adding new settings | Version settings JSON, provide defaults for missing keys |
| Menu events lost if window not focused | Use Tauri's global event system |
| Invalid Claude CLI path crashes AI features | Validate path on change, show error UI, disable AI if invalid |
| Open Recent with missing file | Show dialog with Remove/Locate options |
| Auto-save failure (permissions, disk full) | Toast notification with retry, pause after 3 failures |
| Dynamic shortcut re-registration failure | Fall back to default shortcut, log error |

## Testing Checklist

- [ ] All menu items emit correct events
- [ ] Shortcuts work when app is focused
- [ ] Settings persist across app restarts
- [ ] Settings modal opens from menu (⌘,)
- [ ] Recent projects update correctly
- [ ] Export menu items trigger correct exports
- [ ] Custom shortcuts override defaults
- [ ] Shortcut conflicts show warning
- [ ] Claude CLI path validates correctly (valid/invalid paths)
- [ ] Open Recent gracefully handles missing files
- [ ] Auto-save failure shows notification and retry option
- [ ] Application menu (About, Preferences, Hide) works correctly
