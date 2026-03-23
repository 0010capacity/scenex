import { useEffect, useRef } from 'react';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { TitleBar } from './components/layout/TitleBar';
import { Toolbar } from './components/layout/Toolbar';
import { Workspace } from './components/layout/Workspace';
import { AddPanelModal } from './components/panels/AddPanelModal';
import { useClaude } from './hooks/useClaude';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProject } from './hooks/useProject';
import './styles/global.css';

function App() {
  const { project, newProject } = useProjectStore();
  const { addPanelModalOpen, addPanelSceneId, closeAddPanelModal } = useUIStore();
  const { checkAvailability } = useClaude();
  const { saveProject, isDirty } = useProject();
  const autoSaveTimerRef = useRef<number | null>(null);

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    // Initialize a new project if none exists
    if (!project) {
      newProject('My Storyboard');
    }
  }, [project, newProject]);

  // Check Claude availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setInterval(() => {
      if (isDirty && project) {
        saveProject();
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, project, saveProject]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0B0C10',
        overflow: 'hidden',
      }}
    >
      <TitleBar />
      <Toolbar />
      <Workspace />
      <AddPanelModal
        opened={addPanelModalOpen}
        onClose={closeAddPanelModal}
        sceneId={addPanelSceneId}
      />
    </div>
  );
}

export default App;
