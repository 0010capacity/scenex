import { Box, Text, Center } from '@mantine/core';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { SceneGroup } from '@/components/panels/SceneGroup';

export function PanelCanvas() {
  const { project, selectedSceneId } = useProjectStore();
  const { zoomLevel, viewMode } = useUIStore();

  if (!project) {
    return (
      <Center style={{ height: '100%' }}>
        <Text c="dimmed">Loading...</Text>
      </Center>
    );
  }

  // Show only selected scene or all scenes
  const scenesToShow = selectedSceneId
    ? project.scenes.filter((s) => s.id === selectedSceneId)
    : project.scenes;

  if (scenesToShow.length === 0) {
    return (
      <Center style={{ height: '100%' }}>
        <Text c="dimmed">No scenes yet. Add a scene to get started.</Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        padding: 24,
        height: '100%',
        overflow: 'auto',
      }}
    >
      {scenesToShow.map((scene) => (
        <SceneGroup
          key={scene.id}
          scene={scene}
          zoomLevel={zoomLevel}
          viewMode={viewMode}
        />
      ))}
    </Box>
  );
}
