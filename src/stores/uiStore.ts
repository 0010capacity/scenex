import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_LEFT_SIDEBAR_WIDTH,
  DEFAULT_RIGHT_SIDEBAR_WIDTH,
  DEFAULT_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
} from '@/constants';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;

  // View states
  editorMode: 'storyboard' | 'scenario';
  zoomLevel: number;
  viewMode: 'grid' | 'list' | 'strip' | 'slide';

  // Modal states
  addPanelModalOpen: boolean;
  addPanelSceneId: string | null;
  aiGenModalOpen: boolean;
  projectBrowserOpen: boolean;

  // AI status
  claudeStatus: 'checking' | 'available' | 'unavailable';
  claudeModel: 'haiku' | 'sonnet' | 'opus';

  // Notifications
  notifications: Notification[];

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setZoomLevel: (level: number) => void;
  setViewMode: (mode: 'grid' | 'list' | 'strip' | 'slide') => void;
  setEditorMode: (mode: 'storyboard' | 'scenario') => void;
  openAddPanelModal: (sceneId: string) => void;
  closeAddPanelModal: () => void;
  openAiGenModal: () => void;
  closeAiGenModal: () => void;
  openProjectBrowser: () => void;
  closeProjectBrowser: () => void;
  setClaudeStatus: (status: 'checking' | 'available' | 'unavailable') => void;
  setClaudeModel: (model: 'haiku' | 'sonnet' | 'opus') => void;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      leftSidebarWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,
      rightSidebarWidth: DEFAULT_RIGHT_SIDEBAR_WIDTH,
      editorMode: 'storyboard',
      zoomLevel: DEFAULT_ZOOM_LEVEL,
      viewMode: 'grid',
      addPanelModalOpen: false,
      addPanelSceneId: null,
      aiGenModalOpen: false,
      projectBrowserOpen: false,
      claudeStatus: 'checking',
      claudeModel: 'sonnet',
      notifications: [],

      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      openRightSidebar: () => set({ rightSidebarOpen: true }),
      setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
      setZoomLevel: (level) => set({ zoomLevel: Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, level)) }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setEditorMode: (mode) => set({ editorMode: mode }),
      openAddPanelModal: (sceneId) => set({ addPanelModalOpen: true, addPanelSceneId: sceneId }),
      closeAddPanelModal: () => set({ addPanelModalOpen: false, addPanelSceneId: null }),
      openAiGenModal: () => set({ aiGenModalOpen: true }),
      closeAiGenModal: () => set({ aiGenModalOpen: false }),
      openProjectBrowser: () => set({ projectBrowserOpen: true }),
      closeProjectBrowser: () => set({ projectBrowserOpen: false }),
      setClaudeStatus: (status) => set({ claudeStatus: status }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      addNotification: (type, message) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: crypto.randomUUID(), type, message },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'scenex-ui',
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        editorMode: state.editorMode,
        zoomLevel: state.zoomLevel,
        viewMode: state.viewMode,
        claudeModel: state.claudeModel,
      }),
    }
  )
);
