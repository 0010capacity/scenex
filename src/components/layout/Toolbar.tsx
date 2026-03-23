import { Box } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function Toolbar() {
  const { project, addScene, selectedSceneId, selectScene } = useProjectStore();
  const {
    zoomLevel,
    setZoomLevel,
    viewMode,
    setViewMode,
    openAddPanelModal,
    toggleRightSidebar,
    rightSidebarOpen,
  } = useUIStore();

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
        <button className="tool-btn" onClick={() => {
          const name = prompt('새 장면 이름:');
          if (name) addScene(name);
        }}>
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
    </Box>
  );
}
