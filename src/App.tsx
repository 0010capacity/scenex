import { useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { TitleBar } from './components/layout/TitleBar';
import { Toolbar } from './components/layout/Toolbar';
import { Workspace } from './components/layout/Workspace';
import { AddPanelModal } from './components/panels/AddPanelModal';
import { AiGenModal } from './components/panels/AiGenModal';
import { useClaude } from './hooks/useClaude';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProject } from './hooks/useProject';
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
  const { project, newProject } = useProjectStore();
  const { addPanelModalOpen, addPanelSceneId, closeAddPanelModal, aiGenModalOpen, closeAiGenModal, notifications, removeNotification } = useUIStore();
  const { checkAvailability } = useClaude();
  const { saveProject, isDirty } = useProject();
  const autoSaveTimerRef = useRef<number | null>(null);

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    // Initialize a new project if none exists
    if (!project) {
      newProject('새 프로젝트');
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
