import { Box, Text, Group, Badge } from '@mantine/core';
import { Scene } from '@/types';
import { PanelGrid } from './PanelGrid';

interface SceneGroupProps {
  scene: Scene;
  zoomLevel: number;
  viewMode: 'grid' | 'list';
}

export function SceneGroup({ scene, zoomLevel, viewMode }: SceneGroupProps) {
  return (
    <Box mb={32}>
      {/* Scene header */}
      <Group mb={12} align="center" gap={8}>
        <Text
          size="lg"
          fw={600}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {scene.name}
        </Text>
        <Badge size="sm" variant="light" color="gray">
          {scene.slugline}
        </Badge>
        <Badge size="sm" variant="outline" color="gray">
          {scene.panels.length} panels
        </Badge>
      </Group>

      {/* Panel grid */}
      <PanelGrid
        panels={scene.panels}
        sceneId={scene.id}
        zoomLevel={zoomLevel}
        viewMode={viewMode}
      />
    </Box>
  );
}
