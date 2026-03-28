import { Box, Group, Text } from '@mantine/core';
import { Scene } from '@/types';
import { PanelGrid } from './PanelGrid';
import { calculateSceneDuration } from '@/utils/duration';
import { useProjectStore } from '@/stores/projectStore';

interface SceneGroupProps {
  scene: Scene;
  viewMode: 'grid' | 'list' | 'strip' | 'slide';
}

export function SceneGroup({ scene, viewMode }: SceneGroupProps) {
  const addPanel = useProjectStore(s => s.addPanel);
  const duration = calculateSceneDuration(scene.panels);

  // Scene index from 1
  const sceneIndex = scene.name.match(/^S(\d+)/)?.[1] ?? '?';

  return (
    <Box className="scene-group">
      {/* Scene header */}
      <Group className="scene-row" mb={12} align="center" gap={10}>
        <Box className="scene-chip">{sceneIndex}</Box>
        <Text className="scene-name">{scene.name}</Text>
        <Text className="scene-dur">{duration}</Text>
        <Box className="scene-line" />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => addPanel(scene.id)}
        >
          + 패널
        </button>
      </Group>

      {/* Panel grid */}
      <PanelGrid
        panels={scene.panels}
        sceneId={scene.id}
        viewMode={viewMode}
      />
    </Box>
  );
}
