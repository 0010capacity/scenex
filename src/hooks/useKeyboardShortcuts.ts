import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useProject } from '@/hooks/useProject';

export function useKeyboardShortcuts() {
  const { selectedPanelId, selectedSceneId, deletePanel } = useProjectStore();
  const {
    setZoomLevel,
    zoomLevel,
    openAddPanelModal,
  } = useUIStore();
  const { saveProject } = useProject();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+S: Save project
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        saveProject();
        return;
      }

      // Delete/Backspace: Delete selected panel
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPanelId) {
        // Don't delete if user is typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        deletePanel(selectedPanelId);
        return;
      }

      // Cmd/Ctrl+V: Paste image from clipboard
      if (cmdKey && e.key === 'v') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        // Let the clipboard handler take over
        return;
      }

      // N: New panel (when not typing)
      if (e.key === 'n' && !cmdKey && selectedSceneId) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        openAddPanelModal(selectedSceneId);
        return;
      }

      // +/=: Zoom in
      if (e.key === '+' || e.key === '=') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setZoomLevel(Math.min(200, zoomLevel + 10));
        return;
      }

      // -: Zoom out
      if (e.key === '-') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setZoomLevel(Math.max(50, zoomLevel - 10));
        return;
      }

      // Cmd/Ctrl+0: Reset zoom
      if (cmdKey && e.key === '0') {
        e.preventDefault();
        setZoomLevel(100);
        return;
      }
    },
    [
      selectedPanelId,
      deletePanel,
      saveProject,
      openAddPanelModal,
      selectedSceneId,
      setZoomLevel,
      zoomLevel,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
