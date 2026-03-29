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

      unlisteners.push(await listen('menu:close-project', () => {
        window.dispatchEvent(new CustomEvent('app:close-project'));
      }));

      // Export events
      unlisteners.push(await listen('menu:export-pdf', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'pdf' }));
      }));
      unlisteners.push(await listen('menu:export-images', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'images' }));
      }));
      unlisteners.push(await listen('menu:export-fcp-xml', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'fcp' }));
      }));
      unlisteners.push(await listen('menu:export-premiere-xml', () => {
        window.dispatchEvent(new CustomEvent('app:export', { detail: 'premiere' }));
      }));

      // Edit Menu
      unlisteners.push(await listen('menu:undo', () => {
        window.dispatchEvent(new CustomEvent('editor:undo'));
      }));

      unlisteners.push(await listen('menu:redo', () => {
        window.dispatchEvent(new CustomEvent('editor:redo'));
      }));

      unlisteners.push(await listen('menu:find-in-scenario', () => {
        window.dispatchEvent(new CustomEvent('editor:find'));
      }));

      // View Menu
      unlisteners.push(await listen('menu:view-workspace-scenario', () => {
        setEditorMode('scenario');
      }));

      unlisteners.push(await listen('menu:view-workspace-storyboard', () => {
        setEditorMode('storyboard');
      }));

      unlisteners.push(await listen('menu:view-panel-grid', () => {
        setViewMode('grid');
      }));

      unlisteners.push(await listen('menu:view-panel-strip', () => {
        setViewMode('strip');
      }));

      unlisteners.push(await listen('menu:view-panel-slide', () => {
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
      unlisteners.push(await listen('menu:help-shortcuts', () => {
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
