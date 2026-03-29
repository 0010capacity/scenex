# Native Menu Bar + Settings Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add macOS native menu bar with keyboard shortcuts and a side-tab based Settings modal with persistent settings.

**Architecture:**
- Rust layer: Tauri v2 menu API + tauri-plugin-store for settings persistence
- Frontend layer: Zustand stores, React components, event listeners
- Menu events flow: Native menu → Rust emit → Frontend listener → Zustand action

**Tech Stack:** Tauri v2, React 18, Zustand v5, tauri-plugin-store, Mantine v7

---

## File Structure

### Rust Side

| File | Action | Responsibility |
|------|--------|---------------|
| `src-tauri/Cargo.toml` | Modify | Add tauri-plugin-store dependency |
| `src-tauri/src/lib.rs` | Modify | Register menu.rs, settings.rs modules |
| `src-tauri/src/menu.rs` | Create | MenuBuilder, accelerators, event emission |
| `src-tauri/src/settings.rs` | Create | Settings CRUD via tauri-plugin-store |

### Frontend Side

| File | Action | Responsibility |
|------|--------|---------------|
| `src/stores/settingsStore.ts` | Create | Zustand store for all settings |
| `src/hooks/useMenuEvents.ts` | Create | Listen to Rust menu events, dispatch to stores |
| `src/components/settings/SettingsModal.tsx` | Create | Main modal container |
| `src/components/settings/SettingsSidebar.tsx` | Create | Tab navigation sidebar |
| `src/components/settings/AISection.tsx` | Create | AI tab content |
| `src/components/settings/AppearanceSection.tsx` | Create | Appearance tab content |
| `src/components/settings/ProjectSection.tsx` | Create | Project tab content |
| `src/components/settings/EditorSection.tsx` | Create | Editor tab content |
| `src/components/settings/ShortcutsSection.tsx` | Create | Shortcuts tab content |

---

## Phase 1: Core Menu Infrastructure

### Task 1: Add tauri-plugin-store Dependency

**Files:**
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Add tauri-plugin-store to dependencies**

```toml
# In [dependencies] section
tauri-plugin-store = "2"
```

- [ ] **Step 2: Add to lib.rs plugin initialization**

```rust
// In tauri::Builder chain
.plugin(tauri_plugin_store::init())
```

### Task 2: Create menu.rs

**Files:**
- Create: `src-tauri/src/menu.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Create menu.rs with complete menu structure**

```rust
use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem},
    Manager, Runtime,
};

pub fn create_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let handle = app.clone();

    let menu = MenuBuilder::new(handle)
        // Application Menu (macOS)
        .item(&build_app_menu(handle)?)
        // File Menu
        .item(&build_file_menu(handle)?)
        // Edit Menu
        .item(&build_edit_menu(handle)?)
        // View Menu
        .item(&build_view_menu(handle)?)
        // Window Menu
        .item(&build_window_menu(handle)?)
        // Help Menu
        .item(&build_help_menu(handle)?)
        .build()?;

    Ok(menu)
}

fn build_app_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "SceneX")
        .item(&MenuItemBuilder::with_id("about", "About SceneX").build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("preferences", "Preferences...").accelerator("CmdOrCtrl+,")?.build(handle)?)
        .separator()
        .item(&PredefinedMenuItem::hide(handle)?)
        .item(&PredefinedMenuItem::hide_others(handle)?)
        .item(&PredefinedMenuItem::show_all(handle)?)
        .separator()
        .item(&PredefinedMenuItem::quit(handle)?)
        .build()?;
    Ok(menu)
}

fn build_file_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "File")
        .item(&MenuItemBuilder::with_id("new-project", "New Project").accelerator("CmdOrCtrl+N")?.build(handle)?)
        .item(&MenuItemBuilder::with_id("open", "Open...").accelerator("CmdOrCtrl+O")?.build(handle)?)
        .item(&SubmenuBuilder::new(handle, "Open Recent")
            .item(&MenuItemBuilder::with_id("open-recent-1", "Project 1").build(handle)?)
            .item(&MenuItemBuilder::with_id("open-recent-2", "Project 2").build(handle)?)
            .item(&MenuItemBuilder::with_id("open-recent-3", "Project 3").build(handle)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("save", "Save").accelerator("CmdOrCtrl+S")?.build(handle)?)
        .item(&MenuItemBuilder::with_id("save-as", "Save As...").accelerator("CmdOrCtrl+Shift+S")?.build(handle)?)
        .separator()
        .item(&SubmenuBuilder::new(handle, "Export")
            .item(&MenuItemBuilder::with_id("export-pdf", "Export as PDF").build(handle)?)
            .item(&MenuItemBuilder::with_id("export-images", "Export as Images").build(handle)?)
            .item(&MenuItemBuilder::with_id("export-fcp", "Export as FCP XML").build(handle)?)
            .item(&MenuItemBuilder::with_id("export-premiere", "Export as Premiere XML").build(handle)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("close", "Close Project").accelerator("CmdOrCtrl+W")?.build(handle)?)
        .build()?;
    Ok(menu)
}

fn build_edit_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "Edit")
        .item(&PredefinedMenuItem::undo(handle)?)
        .item(&PredefinedMenuItem::redo(handle)?)
        .separator()
        .item(&PredefinedMenuItem::cut(handle)?)
        .item(&PredefinedMenuItem::copy(handle)?)
        .item(&PredefinedMenuItem::paste(handle)?)
        .item(&PredefinedMenuItem::select_all(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("find", "Find in Scenario").accelerator("CmdOrCtrl+F")?.build(handle)?)
        .build()?;
    Ok(menu)
}

fn build_view_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "View")
        .item(&SubmenuBuilder::new(handle, "Workspace Mode")
            .item(&MenuItemBuilder::with_id("scenario-mode", "Scenario").accelerator("CmdOrCtrl+1")?.build(handle)?)
            .item(&MenuItemBuilder::with_id("storyboard-mode", "Storyboard").accelerator("CmdOrCtrl+2")?.build(handle)?)
            .build()?)
        .item(&SubmenuBuilder::new(handle, "Panel View")
            .item(&MenuItemBuilder::with_id("grid-view", "Grid").accelerator("CmdOrCtrl+Shift+G")?.build(handle)?)
            .item(&MenuItemBuilder::with_id("strip-view", "Strip").accelerator("CmdOrCtrl+Shift+T")?.build(handle)?)
            .item(&MenuItemBuilder::with_id("slide-view", "Slide").accelerator("CmdOrCtrl+Shift+L")?.build(handle)?)
            .build()?)
        .separator()
        .item(&MenuItemBuilder::with_id("zoom-in", "Zoom In").accelerator("CmdOrCtrl+Plus")?.build(handle)?)
        .item(&MenuItemBuilder::with_id("zoom-out", "Zoom Out").accelerator("CmdOrCtrl+Minus")?.build(handle)?)
        .item(&MenuItemBuilder::with_id("zoom-reset", "Reset Zoom").accelerator("CmdOrCtrl+0")?.build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("toggle-inspector", "Toggle Inspector").accelerator("CmdOrCtrl+I")?.build(handle)?)
        .item(&MenuItemBuilder::with_id("toggle-copilot", "Toggle AI Copilot").accelerator("CmdOrCtrl+Shift+C")?.build(handle)?)
        .build()?;
    Ok(menu)
}

fn build_window_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "Window")
        .item(&PredefinedMenuItem::minimize(handle)?)
        .item(&PredefinedMenuItem::fullscreen(handle)?)
        .build()?;
    Ok(menu)
}

fn build_help_menu<R: Runtime>(handle: tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = SubmenuBuilder::new(handle, "Help")
        .item(&MenuItemBuilder::with_id("help", "SceneX Help").build(handle)?)
        .item(&MenuItemBuilder::with_id("shortcuts", "Keyboard Shortcuts").build(handle)?)
        .build()?;
    Ok(menu)
}
```

- [ ] **Step 2: Wire menu to app in lib.rs**

```rust
mod menu;
mod settings;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::init())
        // ... existing plugins ...
        .setup(|app| {
            let menu = menu::create_menu(app.handle())?;
            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(|app, event| {
                let id = event.id().0.as_str();
                app.emit(&format!("menu:{}", id), None).ok();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Task 3: Create settings.rs

**Files:**
- Create: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Create settings.rs**

```rust
use serde::{Deserialize, Serialize};
use tauri::command;

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
    pub theme: String,
    pub font_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub auto_save_interval: u32,
    pub auto_git_commit: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorSettings {
    pub default_workspace_mode: String,
    pub default_panel_view: String,
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
    use tauri_plugin_store::StoreExt;
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let settings = store.get("settings");
    match settings {
        Some(s) => Ok(serde_json::from_value(s.clone()).map_err(|e| e.to_string())?),
        None => Ok(Settings::default()),
    }
}

#[command]
pub async fn set_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let value = serde_json::to_value(&settings).map_err(|e| e.to_string())?;
    store.set("settings", value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 2: Register settings commands in lib.rs**

```rust
.invoke_handler(tauri::generate_handler![
    // ... existing handlers ...
    settings::get_settings,
    settings::set_settings,
])
```

---

## Phase 2: Frontend Core

### Task 4: Create settingsStore.ts

**Files:**
- Create: `src/stores/settingsStore.ts`

- [ ] **Step 1: Create Zustand settings store**

```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface AISettings {
  claudeCliPath: string;
  responseLanguage: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
}

export interface ProjectSettings {
  autoSaveInterval: number;
  autoGitCommit: boolean;
}

export interface EditorSettings {
  defaultWorkspaceMode: 'scenario' | 'storyboard';
  defaultPanelView: 'grid' | 'strip' | 'slide';
}

export interface ShortcutSettings {
  customShortcuts: Record<string, string>;
}

export interface Settings {
  version: number;
  ai: AISettings;
  appearance: AppearanceSettings;
  project: ProjectSettings;
  editor: EditorSettings;
  shortcuts: ShortcutSettings;
}

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateAISettings: (ai: Partial<AISettings>) => Promise<void>;
  updateAppearanceSettings: (appearance: Partial<AppearanceSettings>) => Promise<void>;
  updateProjectSettings: (project: Partial<ProjectSettings>) => Promise<void>;
  updateEditorSettings: (editor: Partial<EditorSettings>) => Promise<void>;
  updateShortcut: (action: string, shortcut: string) => Promise<void>;
  resetShortcuts: () => Promise<void>;
}

const defaultSettings: Settings = {
  version: 1,
  ai: {
    claudeCliPath: '/usr/local/bin/claude',
    responseLanguage: 'ko',
  },
  appearance: {
    theme: 'system',
    fontSize: 14,
  },
  project: {
    autoSaveInterval: 30,
    autoGitCommit: true,
  },
  editor: {
    defaultWorkspaceMode: 'scenario',
    defaultPanelView: 'grid',
  },
  shortcuts: {
    customShortcuts: {},
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invoke<Settings>('get_settings');
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, ...newSettings };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  updateAISettings: async (ai) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, ai: { ...current.ai, ...ai } };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  updateAppearanceSettings: async (appearance) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, appearance: { ...current.appearance, ...appearance } };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  updateProjectSettings: async (project) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, project: { ...current.project, ...project } };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  updateEditorSettings: async (editor) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, editor: { ...current.editor, ...editor } };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  updateShortcut: async (action, shortcut) => {
    const current = get().settings || defaultSettings;
    const updated = {
      ...current,
      shortcuts: {
        ...current.shortcuts,
        customShortcuts: { ...current.shortcuts.customShortcuts, [action]: shortcut },
      },
    };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },

  resetShortcuts: async () => {
    const current = get().settings || defaultSettings;
    const updated = {
      ...current,
      shortcuts: { customShortcuts: {} },
    };
    await invoke('set_settings', { settings: updated });
    set({ settings: updated });
  },
}));
```

### Task 5: Create useMenuEvents Hook

**Files:**
- Create: `src/hooks/useMenuEvents.ts`

- [ ] **Step 1: Create useMenuEvents hook**

```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWorkspace } from './useWorkspace';
import { useUIStore } from '@/stores/uiStore';

export function useMenuEvents() {
  const { saveProjectWithAutoCommit, openProjectWithFilePicker } = useWorkspace();
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const setViewMode = useUIStore(s => s.setViewMode);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const setZoomLevel = useUIStore(s => s.setZoomLevel);
  const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
  const toggleCopilotSidebar = useUIStore(s => s.toggleCopilotSidebar);

  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      // File Menu
      unlisteners.push(await listen('menu:new-project', () => {
        // Trigger new project - handled by toolbar or welcome screen
        window.dispatchEvent(new CustomEvent('app:new-project'));
      }));

      unlisteners.push(await listen('menu:open', () => {
        openProjectWithFilePicker();
      }));

      unlisteners.push(await listen('menu:save', () => {
        saveProjectWithAutoCommit();
      }));

      unlisteners.push(await listen('menu:save-as', () => {
        window.dispatchEvent(new CustomEvent('app:save-as'));
      }));

      unlisteners.push(await listen('menu:close', () => {
        window.dispatchEvent(new CustomEvent('app:close-project'));
      }));

      // Export events
      unlisteners.push(await listen('menu:export-pdf', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'pdf' }));
      }));
      unlisteners.push(await listen('menu:export-images', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'images' }));
      }));
      unlisteners.push(await listen('menu:export-fcp', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'fcp' }));
      }));
      unlisteners.push(await listen('menu:export-premiere', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'premiere' }));
      }));

      // Edit Menu
      unlisteners.push(await listen('menu:undo', () => {
        // CodeMirror undo
        window.dispatchEvent(new CustomEvent('editor:undo'));
      }));

      unlisteners.push(await listen('menu:redo', () => {
        // CodeMirror redo
        window.dispatchEvent(new CustomEvent('editor:redo'));
      }));

      unlisteners.push(await listen('menu:find', () => {
        window.dispatchEvent(new CustomEvent('editor:find'));
      }));

      // View Menu
      unlisteners.push(await listen('menu:scenario-mode', () => {
        setEditorMode('scenario');
      }));

      unlisteners.push(await listen('menu:storyboard-mode', () => {
        setEditorMode('storyboard');
      }));

      unlisteners.push(await listen('menu:grid-view', () => {
        setViewMode('grid');
      }));

      unlisteners.push(await listen('menu:strip-view', () => {
        setViewMode('strip');
      }));

      unlisteners.push(await listen('menu:slide-view', () => {
        setViewMode('slide');
      }));

      unlisteners.push(await listen('menu:zoom-in', () => {
        setZoomLevel(Math.min(zoomLevel + 10, 200));
      }));

      unlisteners.push(await listen('menu:zoom-out', () => {
        setZoomLevel(Math.max(zoomLevel - 10, 10));
      }));

      unlisteners.push(await listen('menu:zoom-reset', () => {
        setZoomLevel(100);
      }));

      unlisteners.push(await listen('menu:toggle-inspector', () => {
        toggleRightSidebar();
      }));

      unlisteners.push(await listen('menu:toggle-copilot', () => {
        toggleCopilotSidebar();
      }));

      // Help Menu
      unlisteners.push(await listen('menu:shortcuts', () => {
        window.dispatchEvent(new CustomEvent('app:show-shortcuts'));
      }));

      unlisteners.push(await listen('menu:about', () => {
        window.dispatchEvent(new CustomEvent('app:show-about'));
      }));

      // App Menu (Preferences)
      unlisteners.push(await listen('menu:preferences', () => {
        window.dispatchEvent(new CustomEvent('app:show-settings'));
      }));
    };

    setupListeners();

    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [
    saveProjectWithAutoCommit, openProjectWithFilePicker,
    setEditorMode, setViewMode, zoomLevel, setZoomLevel,
    toggleRightSidebar, toggleCopilotSidebar,
  ]);
}
```

### Task 6: Integrate useMenuEvents in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add useMenuEvents hook to App**

```tsx
// In App.tsx
import { useMenuEvents } from './hooks/useMenuEvents';

function App() {
  useMenuEvents();
  // ... rest of component
}
```

---

## Phase 3: Settings Modal Components

### Task 7: Create SettingsModal Container

**Files:**
- Create: `src/components/settings/SettingsModal.tsx`

- [ ] **Step 1: Create SettingsModal with tab structure**

```tsx
import { Modal, Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { SettingsSidebar } from './SettingsSidebar';
import { AISection } from './AISection';
import { AppearanceSection } from './AppearanceSection';
import { ProjectSection } from './ProjectSection';
import { EditorSection } from './EditorSection';
import { ShortcutsSection } from './ShortcutsSection';
import { useState } from 'react';

type TabId = 'ai' | 'appearance' | 'project' | 'editor' | 'shortcuts';

export function SettingsModal() {
  const settingsModalOpen = useUIStore(s => s.settingsModalOpen);
  const closeSettingsModal = useUIStore(s => s.closeSettingsModal);
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  const renderContent = () => {
    switch (activeTab) {
      case 'ai': return <AISection />;
      case 'appearance': return <AppearanceSection />;
      case 'project': return <ProjectSection />;
      case 'editor': return <EditorSection />;
      case 'shortcuts': return <ShortcutsSection />;
      default: return null;
    }
  };

  return (
    <Modal
      opened={settingsModalOpen}
      onClose={closeSettingsModal}
      title="Settings"
      size="lg"
      styles={{
        header: { borderBottom: '1px solid var(--border)', paddingBottom: 12 },
        title: { fontWeight: 600, fontSize: 16 },
        body: { padding: 0, minHeight: 400 },
      }}
    >
      <Box style={{ display: 'flex', height: 400 }}>
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <Box style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          {renderContent()}
        </Box>
      </Box>
    </Modal>
  );
}
```

### Task 8: Create SettingsSidebar

**Files:**
- Create: `src/components/settings/SettingsSidebar.tsx`

- [ ] **Step 1: Create sidebar navigation**

```tsx
import { Box } from '@mantine/core';
import { IconBrain, IconPalette, IconFolder, IconEdit, IconKeyboard } from '@tabler/icons-react';

type TabId = 'ai' | 'appearance' | 'project' | 'editor' | 'shortcuts';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'ai' as TabId, label: 'AI', icon: IconBrain },
  { id: 'appearance' as TabId, label: '외관', icon: IconPalette },
  { id: 'project' as TabId, label: '프로젝트', icon: IconFolder },
  { id: 'editor' as TabId, label: '에디터', icon: IconEdit },
  { id: 'shortcuts' as TabId, label: '단축키', icon: IconKeyboard },
];

export function SettingsSidebar({ activeTab, onTabChange }: Props) {
  return (
    <Box className="settings-sidebar">
      {tabs.map(tab => (
        <Box
          key={tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon size={16} stroke={1.5} />
          <span>{tab.label}</span>
        </Box>
      ))}
    </Box>
  );
}
```

### Task 9: Create AI Section

**Files:**
- Create: `src/components/settings/AISection.tsx`

- [ ] **Step 1: Create AI settings section**

```tsx
import { Box, Text, Button, TextInput, SegmentedControl } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';

export function AISection() {
  const { settings, updateAISettings } = useSettingsStore();
  const [pathValid, setPathValid] = useState<boolean | null>(null);

  const validatePath = (path: string) => {
    // Simple validation - in real impl, would check file existence
    const exists = path.length > 0;
    setPathValid(exists);
  };

  const handlePathBlur = () => {
    if (settings?.ai.claudeCliPath) {
      validatePath(settings.ai.claudeCliPath);
    }
  };

  return (
    <Box>
      <Text fw={600} mb={16}>AI Settings</Text>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>Claude CLI Path</Text>
        <Box style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1 }}
            value={settings?.ai.claudeCliPath || ''}
            onChange={(e) => updateAISettings({ claudeCliPath: e.target.value })}
            onBlur={handlePathBlur}
            placeholder="/usr/local/bin/claude"
          />
          {pathValid === true && <Text c="green" size="sm">✓</Text>}
          {pathValid === false && <Text c="red" size="sm">✗ Invalid path</Text>}
        </Box>
        <Text size="xs" c="dimmed" mt={4}>
          Path to the claude CLI binary
        </Text>
      </Box>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>AI Response Language</Text>
        <SegmentedControl
          value={settings?.ai.responseLanguage || 'ko'}
          onChange={(value) => updateAISettings({ responseLanguage: value })}
          data={[
            { label: '한국어', value: 'ko' },
            { label: 'English', value: 'en' },
          ]}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Language for AI responses
        </Text>
      </Box>
    </Box>
  );
}
```

### Task 10: Create AppearanceSection

**Files:**
- Create: `src/components/settings/AppearanceSection.tsx`

- [ ] **Step 1: Create appearance settings section**

```tsx
import { Box, Text, SegmentedControl, Slider } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function AppearanceSection() {
  const { settings, updateAppearanceSettings } = useSettingsStore();

  return (
    <Box>
      <Text fw={600} mb={16}>Appearance</Text>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>Theme</Text>
        <SegmentedControl
          value={settings?.appearance.theme || 'system'}
          onChange={(value) => updateAppearanceSettings({ theme: value as 'light' | 'dark' | 'system' })}
          data={[
            { label: '라이트', value: 'light' },
            { label: '다크', value: 'dark' },
            { label: '시스템', value: 'system' },
          ]}
        />
      </Box>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>
          Font Size: {settings?.appearance.fontSize || 14}px
        </Text>
        <Slider
          value={settings?.appearance.fontSize || 14}
          onChange={(value) => updateAppearanceSettings({ fontSize: value })}
          min={12}
          max={20}
          step={1}
          marks={[
            { value: 12, label: '12' },
            { value: 14, label: '14' },
            { value: 16, label: '16' },
            { value: 18, label: '18' },
            { value: 20, label: '20' },
          ]}
        />
      </Box>
    </Box>
  );
}
```

### Task 11: Create ProjectSection

**Files:**
- Create: `src/components/settings/ProjectSection.tsx`

- [ ] **Step 1: Create project settings section**

```tsx
import { Box, Text, NumberInput, Switch } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function ProjectSection() {
  const { settings, updateProjectSettings } = useSettingsStore();

  return (
    <Box>
      <Text fw={600} mb={16}>Project</Text>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>Auto-save Interval</Text>
        <NumberInput
          value={settings?.project.autoSaveInterval ?? 30}
          onChange={(value) => updateProjectSettings({ autoSaveInterval: Number(value) })}
          min={0}
          max={300}
          step={5}
          suffix=" seconds"
          mb={8}
        />
        <Text size="xs" c="dimmed">
          Set to 0 to disable auto-save
        </Text>
      </Box>

      <Box mb={24}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Text size="sm" fw={500}>Auto Git Commit</Text>
            <Text size="xs" c="dimmed">
              Automatically commit changes when saving
            </Text>
          </Box>
          <Switch
            checked={settings?.project.autoGitCommit ?? true}
            onChange={(e) => updateProjectSettings({ autoGitCommit: e.currentTarget.checked })}
          />
        </Box>
      </Box>
    </Box>
  );
}
```

### Task 12: Create EditorSection

**Files:**
- Create: `src/components/settings/EditorSection.tsx`

- [ ] **Step 1: Create editor settings section**

```tsx
import { Box, Text, SegmentedControl } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function EditorSection() {
  const { settings, updateEditorSettings } = useSettingsStore();

  return (
    <Box>
      <Text fw={600} mb={16}>Editor</Text>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>Default Workspace Mode</Text>
        <SegmentedControl
          value={settings?.editor.defaultWorkspaceMode || 'scenario'}
          onChange={(value) => updateEditorSettings({ defaultWorkspaceMode: value as 'scenario' | 'storyboard' })}
          data={[
            { label: 'Scenario', value: 'scenario' },
            { label: 'Storyboard', value: 'storyboard' },
          ]}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Mode when opening a new project
        </Text>
      </Box>

      <Box mb={24}>
        <Text size="sm" fw={500} mb={8}>Default Panel View</Text>
        <SegmentedControl
          value={settings?.editor.defaultPanelView || 'grid'}
          onChange={(value) => updateEditorSettings({ defaultPanelView: value as 'grid' | 'strip' | 'slide' })}
          data={[
            { label: 'Grid', value: 'grid' },
            { label: 'Strip', value: 'strip' },
            { label: 'Slide', value: 'slide' },
          ]}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Panel layout in storyboard view
        </Text>
      </Box>
    </Box>
  );
}
```

### Task 13: Create ShortcutsSection

**Files:**
- Create: `src/components/settings/ShortcutsSection.tsx`

- [ ] **Step 1: Create shortcuts customization section**

```tsx
import { Box, Text, Button, TextInput } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';

interface ShortcutEntry {
  id: string;
  label: string;
  category: string;
}

const defaultShortcuts: ShortcutEntry[] = [
  { id: 'newProject', label: 'New Project', category: 'File' },
  { id: 'openProject', label: 'Open...', category: 'File' },
  { id: 'saveProject', label: 'Save', category: 'File' },
  { id: 'saveProjectAs', label: 'Save As...', category: 'File' },
  { id: 'closeProject', label: 'Close Project', category: 'File' },
  { id: 'undo', label: 'Undo', category: 'Edit' },
  { id: 'redo', label: 'Redo', category: 'Edit' },
  { id: 'find', label: 'Find in Scenario', category: 'Edit' },
  { id: 'scenarioMode', label: 'Scenario Mode', category: 'View' },
  { id: 'storyboardMode', label: 'Storyboard Mode', category: 'View' },
  { id: 'gridView', label: 'Grid View', category: 'View' },
  { id: 'stripView', label: 'Strip View', category: 'View' },
  { id: 'slideView', label: 'Slide View', category: 'View' },
  { id: 'zoomIn', label: 'Zoom In', category: 'View' },
  { id: 'zoomOut', label: 'Zoom Out', category: 'View' },
  { id: 'resetZoom', label: 'Reset Zoom', category: 'View' },
  { id: 'toggleInspector', label: 'Toggle Inspector', category: 'View' },
  { id: 'toggleCopilot', label: 'Toggle AI Copilot', category: 'View' },
];

export function ShortcutsSection() {
  const { settings, updateShortcut, resetShortcuts } = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);

  const categories = [...new Set(defaultShortcuts.map(s => s.category))];

  const filteredShortcuts = defaultShortcuts.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getShortcut = (id: string) => {
    return settings?.shortcuts.customShortcuts[id] || getDefaultShortcut(id);
  };

  const getDefaultShortcut = (id: string) => {
    const defaults: Record<string, string> = {
      newProject: '⌘N',
      openProject: '⌘O',
      saveProject: '⌘S',
      saveProjectAs: '⌘⇧S',
      closeProject: '⌘W',
      undo: '⌘Z',
      redo: '⌘⇧Z',
      find: '⌘F',
      scenarioMode: '⌘1',
      storyboardMode: '⌘2',
      gridView: '⌘⇧G',
      stripView: '⌘⇧T',
      slideView: '⌘⇧L',
      zoomIn: '⌘+',
      zoomOut: '⌘-',
      resetZoom: '⌘0',
      toggleInspector: '⌘I',
      toggleCopilot: '⌘⇧C',
    };
    return defaults[id] || '';
  };

  return (
    <Box>
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 16 }}>
        <Text fw={600}>Keyboard Shortcuts</Text>
        <Button size="xs" variant="subtle" onClick={resetShortcuts}>
          Reset All
        </Button>
      </Box>

      <TextInput
        placeholder="Search shortcuts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb={16}
      />

      {conflict && (
        <Box className="shortcut-conflict" mb={16}>
          <Text size="sm" c="red">⚠ {conflict}</Text>
        </Box>
      )}

      {categories.map(category => {
        const categoryShortcuts = filteredShortcuts.filter(s => s.category === category);
        if (categoryShortcuts.length === 0) return null;

        return (
          <Box key={category} mb={16}>
            <Text size="xs" c="dimmed" fw={500} mb={8}>{category.toUpperCase()}</Text>
            {categoryShortcuts.map(shortcut => (
              <Box key={shortcut.id} className="shortcut-row">
                <Text size="sm">{shortcut.label}</Text>
                {editingId === shortcut.id ? (
                  <TextInput
                    size="xs"
                    autoFocus
                    placeholder={getShortcut(shortcut.id)}
                    onBlur={(e) => {
                      updateShortcut(shortcut.id, e.target.value);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateShortcut(shortcut.id, (e.target as HTMLInputElement).value);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => setEditingId(shortcut.id)}
                  >
                    {getShortcut(shortcut.id)}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
```

### Task 14: Add UI Store for Settings Modal

**Files:**
- Modify: `src/stores/uiStore.ts`

- [ ] **Step 1: Add settingsModalOpen state**

```typescript
// In uiStore.ts, add to the interface:
interface UIState {
  // ... existing state ...
  settingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

// In the store implementation:
settingsModalOpen: false,
openSettingsModal: () => set({ settingsModalOpen: true }),
closeSettingsModal: () => set({ settingsModalOpen: false }),
```

### Task 15: Add CSS for Settings Components

**Files:**
- Modify: `src/styles/global.css` (or relevant CSS file)

- [ ] **Step 1: Add settings modal styles**

```css
/* Settings Sidebar */
.settings-sidebar {
  width: 160px;
  border-right: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--r4);
  cursor: pointer;
  font-size: 13px;
  color: var(--text2);
  transition: background 0.15s, color 0.15s;
}

.settings-tab:hover {
  background: var(--bg2);
  color: var(--text);
}

.settings-tab.active {
  background: var(--primary);
  color: white;
}

/* Shortcut Row */
.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.shortcut-row:last-child {
  border-bottom: none;
}

.shortcut-conflict {
  padding: 8px 12px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: var(--r4);
}
```

---

## Phase 4: Wire Settings Modal to App

### Task 16: Integrate SettingsModal in App

**Files:**
- Modify: `src/App.tsx` or relevant entry point

- [ ] **Step 1: Import and add SettingsModal**

```tsx
// Add to imports
import { SettingsModal } from '@/components/settings/SettingsModal';

// Add to JSX
<SettingsModal />
```

### Task 17: Wire Settings Load on App Start

**Files:**
- Modify: `src/App.tsx` or `src/main.tsx`

- [ ] **Step 1: Load settings on app mount**

```tsx
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

function App() {
  const loadSettings = useSettingsStore(s => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ... rest
}
```

**Verification**: After loading, open DevTools console and verify no errors. Settings should persist across app restarts.

---

## Phase 5: Final Integration

### Task 18: Wire Settings Modal Open to Menu Event

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Listen for settings modal open event**

```tsx
const openSettingsModal = useUIStore(s => s.openSettingsModal);

useEffect(() => {
  const handler = () => openSettingsModal();
  window.addEventListener('app:show-settings', handler);
  return () => window.removeEventListener('app:show-settings', handler);
}, [openSettingsModal]);
```

### Task 19: Add Menu Event Testing Verification

- [ ] **Step 1: Verify menu events fire correctly**

After completing Tasks 1-6, run the app and verify:
1. Press ⌘N - should trigger new project flow
2. Press ⌘O - should open file picker
3. Press ⌘S - should trigger save
4. Press ⌘1 - should switch to scenario mode
5. Press ⌘2 - should switch to storyboard mode
6. Press ⌘, - should open Settings modal

### Task 20: Verify Build

- [ ] **Step 1: Run build to verify compilation**

```bash
npm run build
```

Expected: Successful build with no TypeScript or Rust errors

---

## Implementation Notes

### Custom Shortcuts (Known Limitation)

Custom shortcuts defined in Settings are **saved to disk** but the **menu accelerators are only re-registered on app restart**. This is a known limitation of the initial implementation.

**Phase 5+ enhancement**: For dynamic shortcut re-registration without app restart:
1. Store menu item IDs and their accelerator callbacks
2. On shortcut change: remove old accelerator, add new one via `app.handle().remove_shortcut()` / `app.handle().add_shortcut()`

### Default Shortcut Mapping

| Action ID | Default Shortcut |
|-----------|-----------------|
| newProject | CommandOrControl+N |
| openProject | CommandOrControl+O |
| saveProject | CommandOrControl+S |
| saveProjectAs | CommandOrControl+Shift+S |
| closeProject | CommandOrControl+W |
| undo | CommandOrControl+Z |
| redo | CommandOrControl+Shift+Z |
| find | CommandOrControl+F |
| scenarioMode | CommandOrControl+1 |
| storyboardMode | CommandOrControl+2 |
| gridView | CommandOrControl+Shift+G |
| stripView | CommandOrControl+Shift+T |
| slideView | CommandOrControl+Shift+L |
| zoomIn | CommandOrControl+Plus |
| zoomOut | CommandOrControl+Minus |
| resetZoom | CommandOrControl+0 |
| toggleInspector | CommandOrControl+I |
| toggleCopilot | CommandOrControl+Shift+C |

### Settings JSON Schema

```json
{
  "version": 1,
  "ai": {
    "claudeCliPath": "/usr/local/bin/claude",
    "responseLanguage": "ko"
  },
  "appearance": {
    "theme": "system",
    "fontSize": 14
  },
  "project": {
    "autoSaveInterval": 30,
    "autoGitCommit": true
  },
  "editor": {
    "defaultWorkspaceMode": "scenario",
    "defaultPanelView": "grid"
  },
  "shortcuts": {
    "customShortcuts": {}
  }
}
```
