import {
  Drawer,
  Text,
  Button,
  Stack,
  Group,
  Select,
  Progress,
  Box,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { Scenario } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';

interface ScenarioAIPanelProps {
  opened: boolean;
  onClose: () => void;
  scenario: Scenario | undefined;
}

type AIAction = 'polish' | 'expand' | 'condense' | 'toStoryboard';

export function ScenarioAIPanel({ opened, onClose, scenario }: ScenarioAIPanelProps) {
  const updateScenario = useProjectStore(s => s.updateScenario);
  const addTask = useAIStore(s => s.addTask);
  const updateTask = useAIStore(s => s.updateTask);

  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAIAction = async () => {
    if (!scenario || !selectedAction) return;

    setIsProcessing(true);
    setProgress(10);

    const taskId = addTask({
      type: selectedAction === 'toStoryboard' ? 'scenario_to_storyboard' : `${selectedAction}_scenario` as any,
      status: 'running',
      progress: 0,
      message: `AI ${selectedAction}...`,
    });

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      setProgress(30);

      let result;
      if (selectedAction === 'toStoryboard') {
        result = await invoke('scenario_to_storyboard', {
          request: { scenario_json: JSON.stringify(scenario) },
        });
      } else {
        result = await invoke(`scenario_${selectedAction}`, {
          request: { scenario_json: JSON.stringify(scenario) },
        });
      }

      setProgress(70);

      // Update scenario with result
      if (result && typeof result === 'object') {
        const resultObj = result as any;
        if (resultObj.success && resultObj.scenario) {
          updateScenario(resultObj.scenario);
        }
      }

      updateTask(taskId, { status: 'completed', progress: 100 });
      setProgress(100);
    } catch (error) {
      updateTask(taskId, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const actionLabels: Record<AIAction, string> = {
    polish: 'Polish & Improve',
    expand: 'Expand / Flesh Out',
    condense: 'Condense / Tighten',
    toStoryboard: 'Generate Storyboard',
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconSparkles size={20} color="var(--accent)" stroke={1.5} />
          <Text fw={500}>Scenario AI</Text>
        </Group>
      }
      position="right"
      size="md"
    >
      <Stack gap="lg">
        {scenario ? (
          <>
            <Box>
              <Text size="sm" fw={500} mb="xs">
                {scenario.name}
              </Text>
              <Text size="xs" c="dimmed">
                {scenario.content.length} characters
              </Text>
            </Box>

            <Select
              label="AI Action"
              placeholder="Select an action"
              value={selectedAction}
              onChange={(v) => setSelectedAction(v as AIAction)}
              data={[
                { value: 'polish', label: 'Polish & Improve' },
                { value: 'expand', label: 'Expand / Flesh Out' },
                { value: 'condense', label: 'Condense / Tighten' },
                { value: 'toStoryboard', label: 'Generate Storyboard' },
              ]}
            />

            {isProcessing && (
              <Box>
                <Progress value={progress} animated size="sm" />
                <Text size="xs" c="dimmed" mt={4}>
                  Processing... {progress}%
                </Text>
              </Box>
            )}

            <Button
              leftSection={<IconSparkles size={16} stroke={1.5} />}
              onClick={handleAIAction}
              disabled={!selectedAction || isProcessing}
              loading={isProcessing}
              fullWidth
            >
              {selectedAction ? actionLabels[selectedAction] : 'Select an action'}
            </Button>

            <Box
              p="md"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r6)',
                background: 'var(--bg3)',
              }}
            >
              <Text size="xs" fw={500} mb="xs">
                What each action does:
              </Text>
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  <strong>Polish:</strong> Improve descriptions, pacing, flow
                </Text>
                <Text size="xs" c="dimmed">
                  <strong>Expand:</strong> Add more scenes, deepen subplots
                </Text>
                <Text size="xs" c="dimmed">
                  <strong>Condense:</strong> Remove redundancy, tighten narrative
                </Text>
                <Text size="xs" c="dimmed">
                  <strong>Storyboard:</strong> Generate panels from this scenario
                </Text>
              </Stack>
            </Box>
          </>
        ) : (
          <Text c="dimmed" size="sm">
            Select a scenario to use AI actions.
          </Text>
        )}
      </Stack>
    </Drawer>
  );
}
