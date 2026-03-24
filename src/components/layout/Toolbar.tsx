import { Box, Modal, TextInput, Button } from '@mantine/core';
import { IconPlus, IconMinus, IconLayoutBoard, IconFileText } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function Toolbar() {
  const { project, addScene, selectedSceneId, selectScene } = useProjectStore();
  const {
    editorMode,
    setEditorMode,
    zoomLevel,
    setZoomLevel,
    viewMode,
    setViewMode,
    openAddPanelModal,
    toggleRightSidebar,
    rightSidebarOpen,
  } = useUIStore();
  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  const sceneOptions = [
    { value: 'all', label: '전체 장면' },
    ...(project?.scenes.map((s, i) => ({ value: s.id, label: `S${i + 1} — ${s.name}` })) ?? []),
  ];

  const viewModes = [
    { key: 'grid', label: '그리드' },
    { key: 'strip', label: '스트립' },
    { key: 'slide', label: '슬라이드' },
  ] as const;

  return (
    <Box className="toolbar">
      {/* Editor mode toggle */}
      <Box className="tool-group">
        <Box className="view-toggle">
          <button
            className={`vt-btn ${editorMode === 'storyboard' ? 'active' : ''}`}
            onClick={() => setEditorMode('storyboard')}
            title="스토리보드"
          >
            <IconLayoutBoard size={14} stroke={1.5} />
          </button>
          <button
            className={`vt-btn ${editorMode === 'scenario' ? 'active' : ''}`}
            onClick={() => setEditorMode('scenario')}
            title="시나리오"
          >
            <IconFileText size={14} stroke={1.5} />
          </button>
        </Box>
      </Box>

      <Box className="tool-sep" />

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
        <button className="tool-btn" onClick={() => setAddSceneModalOpen(true)}>
          <IconPlus size={14} stroke={1.5} />
          장면 추가
        </button>
        <button
          className="tool-btn"
          onClick={() => {
            const sceneId = selectedSceneId ?? project?.scenes[0]?.id;
            if (sceneId) openAddPanelModal(sceneId);
          }}
          style={{
            background: selectedSceneId ? 'var(--accent-dim)' : undefined,
            borderColor: selectedSceneId ? 'rgba(79, 70, 229, 0.4)' : undefined,
            color: selectedSceneId ? 'var(--accent)' : undefined,
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
        className={`tool-btn ${rightSidebarOpen ? 'active' : ''}`}
        onClick={toggleRightSidebar}
      >
        속성 패널
      </button>

      {/* Zoom */}
      <Box className="zoom-group">
        <button className="tool-btn" onClick={() => setZoomLevel(zoomLevel - 10)}>
          <IconMinus size={14} stroke={1.5} />
        </button>
        <span className="zoom-val">{zoomLevel}%</span>
        <button className="tool-btn" onClick={() => setZoomLevel(zoomLevel + 10)}>
          <IconPlus size={14} stroke={1.5} />
        </button>
      </Box>

      {/* Add Scene Modal */}
      <Modal
        opened={addSceneModalOpen}
        onClose={() => {
          setAddSceneModalOpen(false);
          setNewSceneName('');
        }}
        title="새 장면 추가"
        size="sm"
        styles={{
          header: { background: 'var(--bg1)', borderBottom: '1px solid var(--border)' },
          title: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
          body: { background: 'var(--bg1)', padding: 16 },
          content: { background: 'var(--bg1)' },
        }}
      >
        <TextInput
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
          styles={{
            input: {
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 13,
            },
          }}
        />
        <Box style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => {
              setAddSceneModalOpen(false);
              setNewSceneName('');
            }}
            style={{ color: 'var(--text3)' }}
          >
            취소
          </Button>
          <Button
            size="xs"
            onClick={() => {
              if (newSceneName.trim()) {
                addScene(newSceneName.trim());
                setAddSceneModalOpen(false);
                setNewSceneName('');
              }
            }}
            disabled={!newSceneName.trim()}
          >
            추가
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
