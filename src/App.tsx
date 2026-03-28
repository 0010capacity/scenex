import { useEffect, useRef, lazy, Suspense } from 'react';
import { Box, Text, Loader } from '@mantine/core';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { AUTO_SAVE_INTERVAL_MS, NOTIFICATION_AUTO_DISMISS_MS } from './constants';
import { TitleBar } from './components/layout/TitleBar';
import { TabBar } from './components/layout/TabBar';
import { Toolbar } from './components/layout/Toolbar';
import { Workspace } from './components/layout/Workspace';
import { ProjectOnboarding } from './components/onboarding/ProjectOnboarding';
import { AITaskStatus } from './components/AITaskStatus';
import { useClaude } from './hooks/useClaude';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkspace } from './hooks/useWorkspace';
import './styles/global.css';

// Lazy load modals for code splitting
const AddPanelModal = lazy(() => import('./components/panels/AddPanelModal').then(m => ({ default: m.AddPanelModal })));
const AiGenModal = lazy(() => import('./components/panels/AiGenModal').then(m => ({ default: m.AiGenModal })));
const ProjectBrowserModal = lazy(() => import('./components/panels/ProjectBrowserModal').then(m => ({ default: m.ProjectBrowserModal })));

// Modal loading fallback
function ModalLoader() {
  return (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Loader size="sm" color="var(--accent)" />
    </Box>
  );
}

function NotificationToast({ type, message, onDismiss }: { type: 'error' | 'warning' | 'info'; message: string; onDismiss: () => void }) {
  const bgColor = type === 'error' ? 'var(--red-dim)' : type === 'warning' ? 'var(--gold-dim)' : 'var(--blue-dim)';
  const borderColor = type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--gold)' : 'var(--blue)';
  const textColor = type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--gold)' : 'var(--blue)';

  useEffect(() => {
    const timer = setTimeout(onDismiss, NOTIFICATION_AUTO_DISMISS_MS);
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
  const project = useProjectStore(s => s.project);
  const addPanelModalOpen = useUIStore(s => s.addPanelModalOpen);
  const addPanelSceneId = useUIStore(s => s.addPanelSceneId);
  const closeAddPanelModal = useUIStore(s => s.closeAddPanelModal);
  const aiGenModalOpen = useUIStore(s => s.aiGenModalOpen);
  const closeAiGenModal = useUIStore(s => s.closeAiGenModal);
  const projectBrowserOpen = useUIStore(s => s.projectBrowserOpen);
  const notifications = useUIStore(s => s.notifications);
  const removeNotification = useUIStore(s => s.removeNotification);
  const currentProjectPath = useWorkspaceStore(s => s.currentProjectPath);
  const currentProjectName = useWorkspaceStore(s => s.currentProjectName);
  const { checkAvailability } = useClaude();
  const { saveProjectWithAutoCommit, loadProjectFromFile } = useWorkspace();
  const autoSaveTimerRef = useRef<number | null>(null);
  const projectLoadAttemptedRef = useRef(false);

  const hasProject = project !== null;

  // Auto-load last project on app start
  useEffect(() => {
    if (currentProjectPath && currentProjectName && !hasProject && !projectLoadAttemptedRef.current) {
      projectLoadAttemptedRef.current = true;
      const filePath = `${currentProjectPath}/${currentProjectName}.scenex`;
      loadProjectFromFile(filePath).catch((error) => {
        console.warn('[App] Failed to auto-load project:', error);
      });
    }
  }, [currentProjectPath, currentProjectName, hasProject, loadProjectFromFile]);

  // Register keyboard shortcuts - always call
  useKeyboardShortcuts();

  // Check Claude availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

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
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasProject, currentProjectPath, project, saveProjectWithAutoCommit]);

  // Show onboarding if no project
  if (!hasProject) {
    return (
      <div className="light-mode" style={{ height: '100vh' }}>
        <ProjectOnboarding />
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
      <TabBar />
      <Toolbar />
      <Workspace />
      <Suspense fallback={<ModalLoader />}>
        {addPanelModalOpen && (
          <AddPanelModal
            opened={addPanelModalOpen}
            onClose={closeAddPanelModal}
            sceneId={addPanelSceneId}
          />
        )}
      </Suspense>
      <Suspense fallback={<ModalLoader />}>
        {aiGenModalOpen && (
          <AiGenModal
            opened={aiGenModalOpen}
            onClose={closeAiGenModal}
          />
        )}
      </Suspense>
      <Suspense fallback={<ModalLoader />}>
        {projectBrowserOpen && <ProjectBrowserModal />}
      </Suspense>
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
            zIndex: 'var(--z-toast)',
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
