import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { PanelCanvas } from './PanelCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { ScenarioEditor } from '@/components/scenario/ScenarioEditor';
import { ResizeHandle } from './ResizeHandle';
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/constants';

export function Workspace() {
  const {
    rightSidebarOpen,
    editorMode,
    rightSidebarWidth,
    setRightSidebarWidth,
  } = useUIStore();

  const handleRightResize = (delta: number) => {
    const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, rightSidebarWidth + delta));
    setRightSidebarWidth(newWidth);
  };

  // Scenario mode: full-width ScenarioEditor
  if (editorMode === 'scenario') {
    return (
      <Box className="workspace">
        <Box className="canvas-area" style={{ flex: 1 }}>
          <ScenarioEditor />
        </Box>
      </Box>
    );
  }

  // Storyboard mode: PanelCanvas + InspectorPanel (no left sidebar)
  return (
    <Box className="workspace">
      {/* Center: Canvas */}
      <Box className="canvas-area">
        <PanelCanvas />
      </Box>

      {/* Resize handle for right panel */}
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
    </Box>
  );
}
