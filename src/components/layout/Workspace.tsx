import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { PanelCanvas } from './PanelCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { ScenarioEditor } from '@/components/scenario/ScenarioEditor';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';
import { ResizeHandle } from './ResizeHandle';
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/constants';

export function Workspace() {
  const {
    rightSidebarOpen,
    editorMode,
    copilotSidebarOpen,
    rightSidebarWidth,
    setRightSidebarWidth,
    copilotSidebarWidth,
    setCopilotSidebarWidth,
  } = useUIStore();

  const handleRightResize = (delta: number) => {
    const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, rightSidebarWidth + delta));
    setRightSidebarWidth(newWidth);
  };

  const COPILOT_SIDEBAR_MIN = 280;
  const COPILOT_SIDEBAR_MAX = 480;

  const handleCopilotResize = (delta: number) => {
    const newWidth = Math.max(COPILOT_SIDEBAR_MIN, Math.min(COPILOT_SIDEBAR_MAX, copilotSidebarWidth + delta));
    setCopilotSidebarWidth(newWidth);
  };

  // Scenario mode: full-width ScenarioEditor + optional CopilotSidebar
  if (editorMode === 'scenario') {
    return (
      <Box className="workspace">
        <Box className="canvas-area" style={{ flex: 1 }}>
          <ScenarioEditor />
        </Box>

        {/* Resize handle for copilot sidebar */}
        {copilotSidebarOpen && (
          <ResizeHandle
            side="right"
            onResize={handleCopilotResize}
            minWidth={COPILOT_SIDEBAR_MIN}
            maxWidth={COPILOT_SIDEBAR_MAX}
            currentWidth={copilotSidebarWidth}
          />
        )}

        {/* Right: Copilot Sidebar */}
        {copilotSidebarOpen && (
          <CopilotSidebar
            opened={copilotSidebarOpen}
            width={copilotSidebarWidth}
          />
        )}
      </Box>
    );
  }

  // Storyboard mode: PanelCanvas + InspectorPanel + CopilotSidebar
  return (
    <Box className="workspace">
      {/* Center: Canvas */}
      <Box className="canvas-area">
        <PanelCanvas />
      </Box>

      {/* Resize handle for inspector panel */}
      {rightSidebarOpen && (
        <ResizeHandle
          side="right"
          onResize={handleRightResize}
          minWidth={SIDEBAR_MIN_WIDTH}
          maxWidth={SIDEBAR_MAX_WIDTH}
          currentWidth={rightSidebarWidth}
        />
      )}

      {/* Right: Inspector */}
      <Box
        className={`right-panel ${rightSidebarOpen ? 'open' : ''}`}
        style={rightSidebarOpen ? { width: rightSidebarWidth, flexShrink: 0 } : undefined}
      >
        <InspectorPanel />
      </Box>

      {/* Resize handle for copilot sidebar */}
      {copilotSidebarOpen && rightSidebarOpen && (
        <ResizeHandle
          side="right"
          onResize={handleCopilotResize}
          minWidth={COPILOT_SIDEBAR_MIN}
          maxWidth={COPILOT_SIDEBAR_MAX}
          currentWidth={copilotSidebarWidth}
        />
      )}

      {/* Far right: Copilot Sidebar */}
      {copilotSidebarOpen && (
        <CopilotSidebar
          opened={copilotSidebarOpen}
          width={copilotSidebarWidth}
        />
      )}
    </Box>
  );
}
