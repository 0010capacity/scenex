import { Box, ActionIcon } from '@mantine/core';
import { IconPlus, IconMinus, IconTrash, IconPencil, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function Toolbar() {
  const project = useProjectStore(s => s.project);
  const addScene = useProjectStore(s => s.addScene);
  const selectedSceneId = useProjectStore(s => s.selectedSceneId);
  const selectScene = useProjectStore(s => s.selectScene);
  const addScenario = useProjectStore(s => s.addScenario);
  const selectedScenarioId = useProjectStore(s => s.selectedScenarioId);
  const selectScenario = useProjectStore(s => s.selectScenario);
  const deleteScenario = useProjectStore(s => s.deleteScenario);
  const updateScenario = useProjectStore(s => s.updateScenario);

  const editorMode = useUIStore(s => s.editorMode);
  const copilotSidebarOpen = useUIStore(s => s.copilotSidebarOpen);
  const toggleCopilotSidebar = useUIStore(s => s.toggleCopilotSidebar);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const setZoomLevel = useUIStore(s => s.setZoomLevel);
  const viewMode = useUIStore(s => s.viewMode);
  const setViewMode = useUIStore(s => s.setViewMode);
  const openAddPanelModal = useUIStore(s => s.openAddPanelModal);
  const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
  const rightSidebarOpen = useUIStore(s => s.rightSidebarOpen);
  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [addScenarioModalOpen, setAddScenarioModalOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [deleteScenarioModalOpen, setDeleteScenarioModalOpen] = useState(false);
  const [renameScenarioModalOpen, setRenameScenarioModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const sceneOptions = [
    { value: 'all', label: '전체 장면' },
    ...(project?.scenes.map((s, i) => ({ value: s.id, label: `S${i + 1} — ${s.name}` })) ?? []),
  ];

  const viewModes = [
    { key: 'grid', label: '그리드' },
    { key: 'strip', label: '스트립' },
    { key: 'slide', label: '슬라이드' },
  ] as const;

  // Scenario Toolbar
  if (editorMode === 'scenario') {
    return (
      <Box className="toolbar">
        {/* Add scenario */}
        <Box className="tool-group">
          <button className="btn btn-ghost btn-sm" onClick={() => setAddScenarioModalOpen(true)}>
            <IconPlus size={14} stroke={1.5} />
            새 시나리오
          </button>
        </Box>

        <Box className="tool-sep" />

        {/* Rename & Delete scenario */}
        <Box className="tool-group">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const scenario = project?.scenarios.find((s) => s.id === selectedScenarioId);
              if (scenario) {
                setRenameValue(scenario.name);
                setRenameScenarioModalOpen(true);
              }
            }}
            disabled={!selectedScenarioId}
          >
            <IconPencil size={14} stroke={1.5} />
            이름 변경
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDeleteScenarioModalOpen(true)}
            disabled={!selectedScenarioId || (project?.scenarios.length ?? 0) <= 1}
            style={{ color: selectedScenarioId ? 'var(--red)' : undefined }}
          >
            <IconTrash size={14} stroke={1.5} />
            삭제
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

        {/* Add Scenario Modal */}
        {addScenarioModalOpen && (
          <div className="modal-backdrop open" onClick={() => { setAddScenarioModalOpen(false); setNewScenarioName(''); }}>
            <div className="ap-modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
              <div className="ap-header">
                <span style={{ fontSize: 14, fontWeight: 500 }}>새 시나리오 추가</span>
                <ActionIcon variant="subtle" onClick={() => { setAddScenarioModalOpen(false); setNewScenarioName(''); }}><IconPlus size={16} style={{ transform: 'rotate(45deg)' }} /></ActionIcon>
              </div>
              <div className="ap-body">
                <div className="bo-field">
                  <input
                    type="text"
                    placeholder="시나리오 이름"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newScenarioName.trim()) {
                        const newId = addScenario(newScenarioName.trim());
                        selectScenario(newId);
                        setAddScenarioModalOpen(false);
                        setNewScenarioName('');
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
                <button className="btn btn-outline" onClick={() => { setAddScenarioModalOpen(false); setNewScenarioName(''); }}>
                  취소
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (newScenarioName.trim()) {
                      const newId = addScenario(newScenarioName.trim());
                      selectScenario(newId);
                      setAddScenarioModalOpen(false);
                      setNewScenarioName('');
                    }
                  }}
                  disabled={!newScenarioName.trim()}
                  style={!newScenarioName.trim() ? { background: 'var(--bg4)', color: 'var(--text3)', cursor: 'not-allowed' } : {}}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Scenario Modal */}
        {deleteScenarioModalOpen && (
          <div className="modal-backdrop open" onClick={() => setDeleteScenarioModalOpen(false)}>
            <div className="ap-modal" style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
              <div className="ap-header">
                <span style={{ fontSize: 14, fontWeight: 500 }}>시나리오 삭제</span>
                <ActionIcon variant="subtle" onClick={() => setDeleteScenarioModalOpen(false)}><IconPlus size={16} style={{ transform: 'rotate(45deg)' }} /></ActionIcon>
              </div>
              <div className="ap-body">
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                  정말로 이 시나리오를 삭제하시겠습니까?
                </span>
              </div>
              <div className="ap-footer">
                <button className="btn btn-outline" onClick={() => setDeleteScenarioModalOpen(false)}>
                  취소
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (selectedScenarioId) {
                      deleteScenario(selectedScenarioId);
                      setDeleteScenarioModalOpen(false);
                    }
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Scenario Modal */}
        {renameScenarioModalOpen && (
          <div className="modal-backdrop open" onClick={() => { setRenameScenarioModalOpen(false); setRenameValue(''); }}>
            <div className="ap-modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
              <div className="ap-header">
                <span style={{ fontSize: 14, fontWeight: 500 }}>시나리오 이름 변경</span>
                <ActionIcon variant="subtle" onClick={() => { setRenameScenarioModalOpen(false); setRenameValue(''); }}><IconPlus size={16} style={{ transform: 'rotate(45deg)' }} /></ActionIcon>
              </div>
              <div className="ap-body">
                <div className="bo-field">
                  <input
                    type="text"
                    placeholder="새 이름"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && renameValue.trim() && selectedScenarioId) {
                        updateScenario(selectedScenarioId, { name: renameValue.trim() });
                        setRenameScenarioModalOpen(false);
                        setRenameValue('');
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
                <button className="btn btn-outline" onClick={() => { setRenameScenarioModalOpen(false); setRenameValue(''); }}>
                  취소
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (renameValue.trim() && selectedScenarioId) {
                      updateScenario(selectedScenarioId, { name: renameValue.trim() });
                      setRenameScenarioModalOpen(false);
                      setRenameValue('');
                    }
                  }}
                  disabled={!renameValue.trim()}
                  style={!renameValue.trim() ? { background: 'var(--bg4)', color: 'var(--text3)', cursor: 'not-allowed' } : {}}
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        )}
      </Box>
    );
  }

  // Storyboard Toolbar
  return (
    <Box className="toolbar">
      {/* Scene selector */}
      <Box className="tool-group">
        <select
          className="scene-select"
          value={selectedSceneId ?? 'all'}
          onChange={(e) => selectScene(e.target.value === 'all' ? null : e.target.value)}
        >
          {sceneOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Box>

      <Box className="tool-sep" />

      {/* Add scene / add panel */}
      <Box className="tool-group">
        <button className="btn btn-ghost btn-sm" onClick={() => setAddSceneModalOpen(true)}>
          <IconPlus size={14} stroke={1.5} />
          장면 추가
        </button>
        <button
          className={`btn btn-sm ${selectedSceneId ? 'btn-accent' : 'btn-ghost'}`}
          onClick={() => {
            const sceneId = selectedSceneId ?? project?.scenes[0]?.id;
            if (sceneId) openAddPanelModal(sceneId);
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
