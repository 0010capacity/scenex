import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;

  // View states
  zoomLevel: number;
  viewMode: 'grid' | 'list';

  // Modal states
  addPanelModalOpen: boolean;
  addPanelSceneId: string | null;

  // AI status
  claudeStatus: 'checking' | 'available' | 'unavailable';

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setZoomLevel: (level: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  openAddPanelModal: (sceneId: string) => void;
  closeAddPanelModal: () => void;
  setClaudeStatus: (status: 'checking' | 'available' | 'unavailable') => void;
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
      claudeStatus: 'checking',

      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
      setZoomLevel: (level) => set({ zoomLevel: Math.max(50, Math.min(200, level)) }),
      setViewMode: (mode) => set({ viewMode: mode }),
      openAddPanelModal: (sceneId) => set({ addPanelModalOpen: true, addPanelSceneId: sceneId }),
      closeAddPanelModal: () => set({ addPanelModalOpen: false, addPanelSceneId: null }),
      setClaudeStatus: (status) => set({ claudeStatus: status }),
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
      }),
    }
  )
);
