import {
  Box,
  Text,
  Select,
  TextInput,
  Textarea,
  Group,
  Button,
  Divider,
  Chip,
  Stack,
  Loader,
} from '@mantine/core';
import { IconSparkles, IconClick } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';
import { useClaude } from '@/hooks/useClaude';
import {
  SHOT_TYPE_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
  MOOD_TAG_OPTIONS,
  TRANSITION_OPTIONS,
  MoodTag,
} from '@/types';

export function InspectorPanel() {
  const { getSelectedPanel, getSelectedScene, updatePanel } = useProjectStore();
  const { addTask, updateTask, removeTask } = useAIStore();
  const { generatePanel } = useClaude();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const panel = getSelectedPanel();
  const scene = getSelectedScene();

  if (!panel) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 8,
        }}
      >
        <IconClick size={32} color="#4E4C48" />
        <Text c="dimmed" size="sm">
          Select a panel to edit its properties
        </Text>
      </Box>
    );
  }

  const handleMoodTagToggle = (tag: MoodTag) => {
    const newTags = panel.moodTags.includes(tag)
      ? panel.moodTags.filter((t) => t !== tag)
      : [...panel.moodTags, tag];
    updatePanel(panel.id, { moodTags: newTags });
  };

  const handleRegenerate = async () => {
    if (!panel || !scene || !panel.description.trim()) return;

    setIsRegenerating(true);

    const taskId = addTask({
      type: 'generate_panel',
      status: 'running',
      progress: 0,
      message: 'Regenerating panel...',
      panelId: panel.id,
      sceneId: scene.id,
    });

    try {
      const response = await generatePanel(
        panel.description,
        panel.shotType ?? undefined,
        panel.moodTags
      );

      if (response.success && response.svg_data) {
        updatePanel(panel.id, {
          svgData: response.svg_data,
          description: response.description || panel.description,
        });
        updateTask(taskId, { status: 'completed', progress: 100 });
      } else {
        updateTask(taskId, {
          status: 'failed',
          message: response.error || 'Generation failed',
        });
      }
    } catch (err) {
      updateTask(taskId, {
        status: 'failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setTimeout(() => removeTask(taskId), 1000);
      setIsRegenerating(false);
    }
  };

  return (
    <Box
      style={{
        height: '100%',
        backgroundColor: '#13141A',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box
        style={{
          padding: '16px',
          borderBottom: '1px solid #2A2826',
          position: 'sticky',
          top: 0,
          backgroundColor: '#13141A',
          zIndex: 1,
        }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600}>
            Panel {panel.number}
          </Text>
          <Button
            size="xs"
            variant="light"
            color="gold"
            leftSection={isRegenerating ? <Loader size={14} color="gold" /> : <IconSparkles size={14} />}
            onClick={handleRegenerate}
            disabled={!panel.description.trim() || isRegenerating}
          >
            Regenerate
          </Button>
        </Group>
      </Box>

      <Stack gap={16} style={{ padding: 16 }}>
        {/* Shot Settings */}
        <Box>
          <Text size="xs" c="dimmed" mb={8} fw={500}>
            SHOT SETTINGS
          </Text>

          <Group grow mb={12}>
            <Select
              label="Shot Type"
              value={panel.shotType}
              onChange={(value) =>
                updatePanel(panel.id, { shotType: value as any })
              }
              data={SHOT_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: `${o.label} - ${o.description}`,
              }))}
              placeholder="Select shot type"
              clearable
              size="sm"
            />
          </Group>

          <Group grow mb={12}>
            <Select
              label="Camera Movement"
              value={panel.cameraMovement}
              onChange={(value) =>
                updatePanel(panel.id, { cameraMovement: value as any })
              }
              data={CAMERA_MOVEMENT_OPTIONS}
              placeholder="Select movement"
              clearable
              size="sm"
            />
            <TextInput
              label="Duration"
              value={panel.duration}
              onChange={(e) =>
                updatePanel(panel.id, { duration: e.currentTarget.value })
              }
              placeholder="3s"
              size="sm"
            />
          </Group>

          <Select
            label="Transition"
            value={panel.transition}
            onChange={(value) =>
              updatePanel(panel.id, { transition: value as any })
            }
            data={TRANSITION_OPTIONS}
            size="sm"
          />
        </Box>

        <Divider color="#2A2826" />

        {/* Description */}
        <Box>
          <Text size="xs" c="dimmed" mb={8} fw={500}>
            DESCRIPTION
          </Text>
          <Textarea
            value={panel.description}
            onChange={(e) =>
              updatePanel(panel.id, { description: e.currentTarget.value })
            }
            placeholder="Describe the shot..."
            minRows={3}
            maxRows={6}
            size="sm"
          />
        </Box>

        <Divider color="#2A2826" />

        {/* Dialogue */}
        <Box>
          <Text size="xs" c="dimmed" mb={8} fw={500}>
            DIALOGUE
          </Text>
          <Textarea
            value={panel.dialogue}
            onChange={(e) =>
              updatePanel(panel.id, { dialogue: e.currentTarget.value })
            }
            placeholder="Character dialogue..."
            minRows={2}
            maxRows={4}
            size="sm"
          />
        </Box>

        <Divider color="#2A2826" />

        {/* Sound */}
        <Box>
          <Text size="xs" c="dimmed" mb={8} fw={500}>
            SOUND / NOTES
          </Text>
          <Textarea
            value={panel.sound}
            onChange={(e) =>
              updatePanel(panel.id, { sound: e.currentTarget.value })
            }
            placeholder="Sound effects, music, notes..."
            minRows={2}
            maxRows={4}
            size="sm"
          />
        </Box>

        <Divider color="#2A2826" />

        {/* Mood Tags */}
        <Box>
          <Text size="xs" c="dimmed" mb={8} fw={500}>
            MOOD TAGS
          </Text>
          <Group gap={8}>
            {MOOD_TAG_OPTIONS.map((tag) => (
              <Chip
                key={tag.value}
                checked={panel.moodTags.includes(tag.value)}
                onChange={() => handleMoodTagToggle(tag.value)}
                color="gold"
                variant="light"
                size="sm"
              >
                {tag.label}
              </Chip>
            ))}
          </Group>
        </Box>

        <Divider color="#2A2826" />

        {/* Source info */}
        <Box>
          <Text size="xs" c="dimmed" mb={4} fw={500}>
            SOURCE
          </Text>
          <Text size="sm" c="dimmed">
            {panel.sourceType === 'ai'
              ? 'AI Generated'
              : panel.sourceType === 'imported'
              ? 'Imported Image'
              : panel.sourceType === 'manual'
              ? 'Manual Entry'
              : 'Empty Panel'}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
