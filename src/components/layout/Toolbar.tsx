import { Box, ActionIcon } from '@mantine/core';
import { IconPlus, IconMinus, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function Toolbar() {
  const project = useProjectStore(s => s.project);
  const addScene = useProjectStore(s => s.addScene);
  const addPanel = useProjectStore(s => s.addPanel);
  const selectedSceneId = useProjectStore(s => s.selectedSceneId);

  const editorMode = useUIStore(s => s.editorMode);
  const copilotSidebarOpen = useUIStore(s => s.copilotSidebarOpen);
  const toggleCopilotSidebar = useUIStore(s => s.toggleCopilotSidebar);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const setZoomLevel = useUIStore(s => s.setZoomLevel);
  const viewMode = useUIStore(s => s.viewMode);
  const setViewMode = useUIStore(s => s.setViewMode);
  const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
  const rightSidebarOpen = useUIStore(s => s.rightSidebarOpen);
  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  const viewModes = [
    { key: 'grid', label: '그리드' },
    { key: 'strip', label: '스트립' },
    { key: 'slide', label: '슬라이드' },
  ] as const;

  // Scenario Toolbar - simplified
  if (editorMode === 'scenario') {
    const insertToScenario = useUIStore(s => s.insertToScenario);

    const insertAct = () => {
      insertToScenario?.('## 액트 이름\n\n');
    };

    const insertScene = () => {
      insertToScenario?.('### INT./EXT. 장소 - 시간\n\n');
    };

    return (
      <Box className="toolbar">
        {/* Add act / scene */}
        <Box className="tool-group">
          <button className="btn btn-ghost btn-sm" onClick={insertAct}>
            <IconPlus size={14} stroke={1.5} />
            액트 추가
          </button>
          <button className="btn btn-ghost btn-sm" onClick={insertScene}>
            <IconPlus size={14} stroke={1.5} />
            장면 추가
          </button>
        </Box>

        {/* Spacer to push copilot to the right */}
        <Box style={{ flex: 1 }} />

        {/* AI Copilot toggle */}
        <button
          className={`btn-pill ${copilotSidebarOpen ? 'active' : ''}`}
          onClick={toggleCopilotSidebar}
          title="AI Copilot"
        >
          <IconSparkles size={14} stroke={1.5} />
          AI
        </button>
      </Box>
    );
  }

  // Storyboard Toolbar
  return (
    <Box className="toolbar">
      {/* Add scene / add panel */}
      <Box className="tool-group">
        <button className="btn btn-ghost btn-sm" onClick={() => setAddSceneModalOpen(true)}>
          <IconPlus size={14} stroke={1.5} />
          장면 추가
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            const sceneId = selectedSceneId || project?.scenario.scenes[0]?.id;
            if (sceneId) addPanel(sceneId);
          }}
        >
          <IconPlus size={14} stroke={1.5} />
          패널 추가
        </button>
      </Box>

      <Box className="tool-sep" />

      {/* View toggle */}
      <Box className="tool-group">
        <Box className="view-toggle">
          {viewModes.map((v) => (
            <button
              key={v.key}
              className={`vt-btn ${viewMode === v.key ? 'active' : ''}`}
              onClick={() => setViewMode(v.key)}
            >
              {v.label}
            </button>
          ))}
        </Box>
      </Box>

      <Box className="tool-sep" />

      {/* Inspector toggle */}
      <button
        className={`btn btn-ghost btn-sm ${rightSidebarOpen ? 'active' : ''}`}
        onClick={toggleRightSidebar}
      >
        속성 패널
      </button>

      {/* Zoom */}
      <Box className="zoom-group">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setZoomLevel(zoomLevel - 10)} aria-label="줌 아웃">
          <IconMinus size={14} stroke={1.5} />
        </button>
        <span className="zoom-val">{zoomLevel}%</span>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setZoomLevel(zoomLevel + 10)} aria-label="줌 인">
          <IconPlus size={14} stroke={1.5} />
        </button>
      </Box>

      {/* Spacer to push copilot to the right */}
      <Box style={{ flex: 1 }} />

      {/* AI Copilot toggle */}
      <button
        className={`btn-pill ${copilotSidebarOpen ? 'active' : ''}`}
        onClick={toggleCopilotSidebar}
        title="AI Copilot"
      >
        <IconSparkles size={14} stroke={1.5} />
        AI
      </button>

      {/* Add Scene Modal */}
      {addSceneModalOpen && (
        <div className="modal-backdrop open" onClick={() => { setAddSceneModalOpen(false); setNewSceneName(''); }}>
          <div className="ap-modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="ap-header">
              <span style={{ fontSize: 14, fontWeight: 500 }}>새 장면 추가</span>
              <ActionIcon variant="subtle" onClick={() => { setAddSceneModalOpen(false); setNewSceneName(''); }}><IconPlus size={16} style={{ transform: 'rotate(45deg)' }} /></ActionIcon>
            </div>
            <div className="ap-body">
              <div className="bo-field">
                <input
                  type="text"
                  placeholder="장면 이름"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSceneName.trim()) {
                      addScene(newSceneName.trim());
                      setAddSceneModalOpen(false);
                      setNewSceneName('');
                    }
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    padding: '8px 12px',
                    borderRadius: 'var(--r4)',
                    fontSize: 13,
                    fontFamily: 'var(--sans)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div className="ap-footer">
              <button className="btn btn-outline" onClick={() => { setAddSceneModalOpen(false); setNewSceneName(''); }}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newSceneName.trim()) {
                    addScene(newSceneName.trim());
                    setAddSceneModalOpen(false);
                    setNewSceneName('');
                  }
                }}
                disabled={!newSceneName.trim()}
                style={!newSceneName.trim() ? { background: 'var(--bg4)', color: 'var(--text3)', cursor: 'not-allowed' } : {}}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
