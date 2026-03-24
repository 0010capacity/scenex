import { useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { TitleBar } from './components/layout/TitleBar';
import { Toolbar } from './components/layout/Toolbar';
import { Workspace } from './components/layout/Workspace';
import { AddPanelModal } from './components/panels/AddPanelModal';
import { AiGenModal } from './components/panels/AiGenModal';
import { ProjectBrowserModal } from './components/panels/ProjectBrowserModal';
import { WorkspaceOnboarding } from './components/onboarding/WorkspaceOnboarding';
import { FirstProjectOnboarding } from './components/onboarding/FirstProjectOnboarding';
import { AITaskStatus } from './components/AITaskStatus';
import { useClaude } from './hooks/useClaude';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkspace } from './hooks/useWorkspace';
import './styles/global.css';

function NotificationToast({ type, message, onDismiss }: { type: 'error' | 'warning' | 'info'; message: string; onDismiss: () => void }) {
  const bgColor = type === 'error' ? 'var(--red-dim)' : type === 'warning' ? 'var(--gold-dim)' : 'var(--blue-dim)';
  const borderColor = type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--gold)' : 'var(--blue)';
  const textColor = type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--gold)' : 'var(--blue)';

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Box
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--r6)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 280,
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Text style={{ fontSize: 12, color: textColor, flex: 1 }}>{message}</Text>
      <Box
        component="button"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text3)',
          cursor: 'pointer',
          padding: 2,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </Box>
    </Box>
  );
}

function App() {
  const { project } = useProjectStore();
  const { addPanelModalOpen, addPanelSceneId, closeAddPanelModal, aiGenModalOpen, closeAiGenModal, projectBrowserOpen, notifications, removeNotification } = useUIStore();
  const { currentWorkspacePath } = useWorkspaceStore();
  const { checkAvailability } = useClaude();
  const { currentProjectPath, saveProjectWithAutoCommit } = useWorkspace();
  const autoSaveTimerRef = useRef<number | null>(null);

  const hasWorkspace = currentWorkspacePath !== null;
  const hasProject = project !== null;

  // Register keyboard shortcuts - always call
  useKeyboardShortcuts();

  // Check Claude availability on mount - only when workspace exists
  useEffect(() => {
    if (hasWorkspace) {
      checkAvailability();
    }
  }, [hasWorkspace, checkAvailability]);

  // Auto-save every 30 seconds when dirty - only when project exists
  useEffect(() => {
    if (!hasProject || !currentProjectPath) return;

    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setInterval(() => {
      if (project && currentProjectPath) {
        saveProjectWithAutoCommit();
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasProject, currentProjectPath, project, saveProjectWithAutoCommit]);

  // Show onboarding #1 if no workspace
  if (!hasWorkspace) {
    return (
      <div className="light-mode" style={{ height: '100vh' }}>
        <WorkspaceOnboarding />
      </div>
    );
  }

  // Show onboarding #2 if workspace exists but no project
  if (!hasProject) {
    return (
      <div className="light-mode" style={{ height: '100vh' }}>
        <FirstProjectOnboarding />
      </div>
    );
  }

  return (
    <div
      className="light-mode"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg0)',
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
      <AiGenModal
        opened={aiGenModalOpen}
        onClose={closeAiGenModal}
      />
      {projectBrowserOpen && <ProjectBrowserModal />}
      <AITaskStatus />
      {/* Notifications */}
      {notifications.length > 0 && (
        <Box
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 9999,
          }}
        >
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              type={notification.type}
              message={notification.message}
              onDismiss={() => removeNotification(notification.id)}
            />
          ))}
        </Box>
      )}
    </div>
  );
}

export default App;
