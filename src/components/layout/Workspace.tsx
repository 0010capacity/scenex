import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { ScenarioSidebar } from './ScenarioSidebar';
import { PanelCanvas } from './PanelCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { ScenarioEditor } from '@/components/scenario/ScenarioEditor';

export function Workspace() {
  const { leftSidebarOpen, rightSidebarOpen, editorMode } = useUIStore();

  if (editorMode === 'scenario') {
    return (
      <Box className="workspace">
        {/* Scenario editor takes full width */}
        <Box className="canvas-area" style={{ flex: 1 }}>
          <ScenarioEditor />
        </Box>
      </Box>
    );
  }

  return (
    <Box className="workspace">
      {/* Left: Scenario sidebar */}
      <Box className={`left-sidebar ${leftSidebarOpen ? 'open' : ''}`}>
        <ScenarioSidebar />
      </Box>

      {/* Center: Canvas */}
      <Box className="canvas-area">
        <PanelCanvas />
      </Box>

      {/* Right: Inspector */}
      <Box className={`right-panel ${rightSidebarOpen ? 'open' : ''}`}>
        <InspectorPanel />
      </Box>
    </Box>
  );
}
