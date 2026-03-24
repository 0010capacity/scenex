import { Box, Text, Group, Badge, ActionIcon } from '@mantine/core';
import { IconTrash, IconEdit } from '@tabler/icons-react';
import { ScenarioScene } from '@/types/scenario';
import { useProjectStore } from '@/stores/projectStore';

interface SceneEditorProps {
  scene: ScenarioScene;
  actId: string;
  scenarioId: string;
}

export function SceneEditor({ scene, actId, scenarioId }: SceneEditorProps) {
  const { deleteSceneFromAct } = useProjectStore();

  return (
    <Box
      className="scene-editor"
      p="sm"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r4)',
        background: 'var(--bg3)',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={4}>
            <Badge size="xs" variant="light">
              {scene.slugline || 'No slugline'}
            </Badge>
            {scene.panels.length > 0 && (
              <Badge size="xs" variant="outline" color="grape">
                {scene.panels.length} panels
              </Badge>
            )}
          </Group>
          <Text
            size="sm"
            truncate
            style={{
              color: scene.description ? 'var(--text)' : 'var(--text3)',
              fontStyle: scene.description ? 'normal' : 'italic',
            }}
          >
            {scene.description || 'No description'}
          </Text>
        </Box>

        <Group gap={4}>
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => {
              // TODO: Open scene detail/markdown editor
            }}
          >
            <IconEdit size={14} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => deleteSceneFromAct(scenarioId, actId, scene.id)}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
