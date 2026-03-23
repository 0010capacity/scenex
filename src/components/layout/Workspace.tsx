import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { ScenarioSidebar } from './ScenarioSidebar';
import { PanelCanvas } from './PanelCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';

export function Workspace() {
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    leftSidebarWidth,
    rightSidebarWidth,
  } = useUIStore();

  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#0B0C10',
      }}
    >
      {/* Left Sidebar - Scenario */}
      {leftSidebarOpen && (
        <Box
          style={{
            width: leftSidebarWidth,
            minWidth: 200,
            maxWidth: 400,
            borderRight: '1px solid #2A2826',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ScenarioSidebar />
        </Box>
      )}

      {/* Main Canvas */}
      <Box
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PanelCanvas />
      </Box>

      {/* Right Sidebar - Inspector */}
      {rightSidebarOpen && (
        <Box
          style={{
            width: rightSidebarWidth,
            minWidth: 280,
            maxWidth: 500,
            borderLeft: '1px solid #2A2826',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <InspectorPanel />
        </Box>
      )}
    </Box>
  );
}
