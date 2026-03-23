import { Box, Text, ActionIcon, Textarea, Group } from '@mantine/core';
import { IconPlus, IconTrash, IconMovie } from '@tabler/icons-react';
import { useProjectStore } from '@/stores/projectStore';

export function ScenarioSidebar() {
  const { project, selectedSceneId, selectScene, updateScene, deleteScene, addScene } =
    useProjectStore();

  if (!project) return null;

  const selectedScene = project.scenes.find((s) => s.id === selectedSceneId);

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#13141A',
      }}
    >
      {/* Scene list */}
      <Box style={{ padding: '12px 16px', borderBottom: '1px solid #2A2826' }}>
        <Group justify="space-between" mb={8}>
          <Text size="sm" fw={600} c="dimmed">
            SCENES
          </Text>
          <ActionIcon size="sm" variant="subtle" onClick={() => addScene()}>
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
        {project.scenes.map((scene, index) => (
          <Box
            key={scene.id}
            onClick={() => selectScene(scene.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              backgroundColor:
                scene.id === selectedSceneId ? '#1A1C24' : 'transparent',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text size="sm" truncate>
              {index + 1}. {scene.name}
            </Text>
            {project.scenes.length > 1 && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScene(scene.id);
                }}
              >
                <IconTrash size={12} />
              </ActionIcon>
            )}
          </Box>
        ))}
      </Box>

      {/* Scene details */}
      {selectedScene ? (
        <Box style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          <Text size="sm" fw={600} c="dimmed" mb={8}>
            SCENE DETAILS
          </Text>

          <Box mb={12}>
            <Text size="xs" c="dimmed" mb={4}>
              Name
            </Text>
            <Textarea
              value={selectedScene.name}
              onChange={(e) =>
                updateScene(selectedScene.id, { name: e.currentTarget.value })
              }
              autosize
              minRows={1}
              maxRows={2}
            />
          </Box>

          <Box mb={12}>
            <Text size="xs" c="dimmed" mb={4}>
              Slugline
            </Text>
            <Textarea
              value={selectedScene.slugline}
              onChange={(e) =>
                updateScene(selectedScene.id, { slugline: e.currentTarget.value })
              }
              autosize
              minRows={1}
              maxRows={2}
              placeholder="INT. LOCATION — DAY"
            />
          </Box>

          <Text size="sm" c="dimmed" mt={16} mb={8}>
            {selectedScene.panels.length} panels
          </Text>
        </Box>
      ) : (
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 8,
          }}
        >
          <IconMovie size={32} color="#4E4C48" />
          <Text size="sm" c="dimmed" ta="center">
            Select a scene to view details
          </Text>
        </Box>
      )}
    </Box>
  );
}
