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
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateAISettings: async (ai) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, ai: { ...current.ai, ...ai } };
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateAppearanceSettings: async (appearance) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, appearance: { ...current.appearance, ...appearance } };
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateProjectSettings: async (project) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, project: { ...current.project, ...project } };
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateEditorSettings: async (editor) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, editor: { ...current.editor, ...editor } };
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
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
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  resetShortcuts: async () => {
    const current = get().settings || defaultSettings;
    const updated = {
      ...current,
      shortcuts: { customShortcuts: {} },
    };
    try {
      await invoke('set_settings', { settings: updated });
      set({ settings: updated });
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
