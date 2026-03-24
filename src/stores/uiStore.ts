import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  zoomLevel: number;
  viewMode: 'grid' | 'list' | 'strip' | 'slide';

  // Modal states
  addPanelModalOpen: boolean;
  addPanelSceneId: string | null;
  aiGenModalOpen: boolean;

  // AI status
  claudeStatus: 'checking' | 'available' | 'unavailable';
  claudeModel: 'haiku' | 'sonnet' | 'opus';

  // Notifications
  notifications: Notification[];

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setZoomLevel: (level: number) => void;
  setViewMode: (mode: 'grid' | 'list' | 'strip' | 'slide') => void;
  openAddPanelModal: (sceneId: string) => void;
  closeAddPanelModal: () => void;
  openAiGenModal: () => void;
  closeAiGenModal: () => void;
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
      leftSidebarWidth: 280,
      rightSidebarWidth: 320,
      zoomLevel: 100,
      viewMode: 'grid',
      addPanelModalOpen: false,
      addPanelSceneId: null,
      aiGenModalOpen: false,
      claudeStatus: 'checking',
      claudeModel: 'sonnet',
      notifications: [],

      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
      setZoomLevel: (level) => set({ zoomLevel: Math.max(50, Math.min(200, level)) }),
      setViewMode: (mode) => set({ viewMode: mode }),
      openAddPanelModal: (sceneId) => set({ addPanelModalOpen: true, addPanelSceneId: sceneId }),
      closeAddPanelModal: () => set({ addPanelModalOpen: false, addPanelSceneId: null }),
      openAiGenModal: () => set({ aiGenModalOpen: true }),
      closeAiGenModal: () => set({ aiGenModalOpen: false }),
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
        zoomLevel: state.zoomLevel,
        viewMode: state.viewMode,
        claudeModel: state.claudeModel,
      }),
    }
  )
);
