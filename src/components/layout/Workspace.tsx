import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { ScenarioSidebar } from './ScenarioSidebar';
import { PanelCanvas } from './PanelCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';

export function Workspace() {
  const { leftSidebarOpen, rightSidebarOpen } = useUIStore();

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
