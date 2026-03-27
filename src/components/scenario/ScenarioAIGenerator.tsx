import { Modal, Text, Textarea, Select, Box, Button, Stack, Progress, Group } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';

interface ScenarioAIGeneratorProps {
  opened: boolean;
  onClose: () => void;
}

export function ScenarioAIGenerator({ opened, onClose }: ScenarioAIGeneratorProps) {
  const { addScenario } = useProjectStore();
  const { addTask, updateTask } = useAIStore();

  const [concept, setConcept] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!concept.trim()) return;

    setIsGenerating(true);
    setProgress(0);

    const taskId = addTask({
      type: 'generate_scenario',
      status: 'running',
      progress: 0,
      message: 'Generating scenario...',
    });

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      setProgress(30);

      const result = await invoke<{
        success: boolean;
        scenario?: any;
        error?: string;
      }>('generate_scenario', {
        request: { concept, genre, mood },
      });

      setProgress(70);

      if (result.success && result.scenario) {
        // Create scenario in project
        const title = result.scenario.title || 'Untitled Scenario';
        addScenario(title);

        // TODO: Parse acts/scenes from result.scenario and add to project

        updateTask(taskId, { status: 'completed', progress: 100 });
        setProgress(100);
        onClose();
        setConcept('');
        setGenre(null);
        setMood(null);
      } else {
        updateTask(taskId, {
          status: 'failed',
          message: result.error || 'Generation failed',
        });
      }
    } catch (error) {
      updateTask(taskId, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconSparkles size={20} color="var(--accent)" stroke={1.5} />
          <Text fw={500}>AI Scenario Generator</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Textarea
          label="Concept"
          description="Describe your story idea in a few sentences"
          placeholder="A detective discovers that their memories are artificial..."
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          minRows={3}
          required
        />

        <Group grow>
          <Select
            label="Genre"
            placeholder="Select genre"
            data={[
              { value: 'drama', label: 'Drama' },
              { value: 'thriller', label: 'Thriller' },
              { value: 'comedy', label: 'Comedy' },
              { value: 'horror', label: 'Horror' },
              { value: 'romance', label: 'Romance' },
              { value: 'scifi', label: 'Sci-Fi' },
            ]}
            value={genre}
            onChange={setGenre}
          />

          <Select
            label="Mood"
            placeholder="Select mood"
            data={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'nostalgic', label: 'Nostalgic' },
              { value: 'tense', label: 'Tense' },
              { value: 'uplifting', label: 'Uplifting' },
            ]}
            value={mood}
            onChange={setMood}
          />
        </Group>

        {isGenerating && (
          <Box>
            <Progress value={progress} size="lg" animated />
            <Text size="xs" c="dimmed" ta="center" mt={4}>
              Generating scenario... {progress}%
            </Text>
          </Box>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            leftSection={<IconSparkles size={16} stroke={1.5} />}
            onClick={handleGenerate}
            disabled={!concept.trim() || isGenerating}
            loading={isGenerating}
          >
            Generate Scenario
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
