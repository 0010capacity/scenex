import { Box, Text, Center } from '@mantine/core';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { SceneGroup } from '@/components/panels/SceneGroup';

export function PanelCanvas() {
  const project = useProjectStore(s => s.project);
  const selectedSceneId = useProjectStore(s => s.selectedSceneId);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const viewMode = useUIStore(s => s.viewMode);

  if (!project) {
    return (
      <Center style={{ height: '100%' }}>
        <Text c="dimmed">로딩 중...</Text>
      </Center>
    );
  }

  const scenesToShow = selectedSceneId
    ? project.scenes.filter((s) => s.id === selectedSceneId)
    : project.scenes;

  if (scenesToShow.length === 0) {
    return (
      <Center style={{ height: '100%' }}>
        <Box className="canvas-empty">
          <Box className="empty-icon">+</Box>
          <Text className="empty-title">프로젝트가 비어있습니다</Text>
          <Text className="empty-sub">시나리오를 입력하거나 AI로 자동 생성하세요</Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box
      className="canvas-inner"
      style={{
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top left',
      }}
    >
      {scenesToShow.map((scene) => (
        <SceneGroup
          key={scene.id}
          scene={scene}
          viewMode={viewMode}
        />
      ))}
    </Box>
  );
}
