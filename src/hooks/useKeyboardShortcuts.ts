import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspace } from '@/hooks/useWorkspace';

async function getImageFromClipboard(): Promise<string | null> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageTypes = item.types.filter(type => type.startsWith('image/'));
      if (imageTypes.length > 0) {
        const blob = await item.getType(imageTypes[0]);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
    return null;
  } catch (error) {
    // Return error info so caller can show appropriate message
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
        return null; // Permission denied
      }
    }
    console.error('Failed to read clipboard:', error);
    return null;
  }
}

export function useKeyboardShortcuts() {
  const selectedPanelId = useProjectStore(s => s.selectedPanelId);
  const selectedSceneId = useProjectStore(s => s.selectedSceneId);
  const deletePanel = useProjectStore(s => s.deletePanel);
  const addPanel = useProjectStore(s => s.addPanel);
  const project = useProjectStore(s => s.project);
  const setZoomLevel = useUIStore(s => s.setZoomLevel);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const openAddPanelModal = useUIStore(s => s.openAddPanelModal);
  const addNotification = useUIStore(s => s.addNotification);
  const { saveProjectWithAutoCommit, currentProjectPath } = useWorkspace();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+S: Save project with auto-commit
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        if (currentProjectPath) {
          saveProjectWithAutoCommit();
        }
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
        // Handle clipboard paste
        if (selectedSceneId) {
          e.preventDefault();
          getImageFromClipboard().then((imageData) => {
            if (imageData) {
              const scene = project?.scenes.find(s => s.id === selectedSceneId);
              const panelNumber = scene ? scene.panels.length + 1 : 1;
              addPanel(selectedSceneId, {
                number: panelNumber,
                imageData,
                sourceType: 'imported',
              });
            } else {
              addNotification('warning', '클립보드에서 이미지를 찾을 수 없습니다. 이미지를 복사한 후 다시 시도하세요.');
            }
          }).catch(() => {
            addNotification('error', '클립보드 접근이 거부되었습니다. 브라우저 권한을 확인하세요.');
          });
        }
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
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setZoomLevel(100);
        return;
      }
    },
    [
      selectedPanelId,
      deletePanel,
      selectedSceneId,
      saveProjectWithAutoCommit,
      currentProjectPath,
      openAddPanelModal,
      setZoomLevel,
      zoomLevel,
      addPanel,
      project,
      addNotification,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
