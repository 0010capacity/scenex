import { Box, Text, Button, Stack, Group } from '@mantine/core';
import {
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { ActEditor } from './ActEditor';
import { ScenarioAIPanel } from './ScenarioAIPanel';

export function ScenarioEditor() {
  const { project, addAct, updateScenario } = useProjectStore();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [aiPanelOpened, setAiPanelOpened] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const scenarios = project?.scenarios || [];
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Auto-select first scenario
  if (!selectedScenarioId && scenarios.length > 0) {
    setSelectedScenarioId(scenarios[0].id);
  }

  const toggleAct = (actId: string) => {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  };

  const handleAddAct = () => {
    if (selectedScenarioId) {
      addAct(selectedScenarioId, `Act ${(selectedScenario?.acts.length || 0) + 1}`);
    }
  };

  const handleNewScenario = () => {
    const name = prompt('Scenario name:');
    if (name) {
      const id = useProjectStore.getState().addScenario(name);
      setSelectedScenarioId(id);
    }
  };

  const handleStartEditName = () => {
    if (selectedScenario) {
      setScenarioName(selectedScenario.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (selectedScenarioId && scenarioName.trim()) {
      updateScenario(selectedScenarioId, { name: scenarioName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <Box className="scenario-editor" style={{ display: 'flex', height: '100%' }}>
      {/* Scenario List Sidebar */}
      <Box
        className="scenario-sidebar"
        style={{
          width: 280,
          borderRight: '1px solid var(--border)',
          padding: 'var(--space-md)',
          overflow: 'auto',
        }}
      >
        <Group justify="space-between" mb="md">
          <Text fw={600} size="sm">
            Scenarios
          </Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={handleNewScenario}
          >
            New
          </Button>
        </Group>

        <Stack gap="xs">
          {scenarios.map((scenario) => (
            <Box
              key={scenario.id}
              p="sm"
              style={{
                borderRadius: 'var(--r4)',
                cursor: 'pointer',
                background:
                  scenario.id === selectedScenarioId
                    ? 'var(--accent-dim)'
                    : 'transparent',
                border:
                  scenario.id === selectedScenarioId
                    ? '1px solid var(--accent)'
                    : '1px solid transparent',
              }}
              onClick={() => setSelectedScenarioId(scenario.id)}
            >
              <Text size="sm" fw={500}>
                {scenario.name}
              </Text>
              <Text size="xs" c="dimmed">
                {scenario.acts.length} acts
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Main Editor Area */}
      <Box style={{ flex: 1, overflow: 'auto', padding: 'var(--space-md)' }}>
        {selectedScenario ? (
          <>
            {/* Scenario Header */}
            <Group justify="space-between" mb="lg">
              <Box>
                {isEditingName ? (
                  <Group>
                    <input
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      autoFocus
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        background: 'var(--bg2)',
                        border: '1px solid var(--accent)',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: 'var(--text)',
                      }}
                    />
                    <Button size="xs" onClick={handleSaveName}>Save</Button>
                    <Button size="xs" variant="subtle" onClick={() => setIsEditingName(false)}>Cancel</Button>
                  </Group>
                ) : (
                  <Text
                    size="xl"
                    fw={600}
                    onClick={handleStartEditName}
                    style={{ cursor: 'pointer' }}
                  >
                    {selectedScenario.name}
                  </Text>
                )}
                <Text size="sm" c="dimmed">
                  {selectedScenario.description || 'No description'}
                </Text>
              </Box>
              <Group>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconSparkles size={16} />}
                  onClick={() => setAiPanelOpened(true)}
                >
                  AI Actions
                </Button>
              </Group>
            </Group>

            {/* Acts List */}
            <Stack gap="md">
              {selectedScenario.acts.map((act) => (
                <ActEditor
                  key={act.id}
                  act={act}
                  expanded={expandedActs.has(act.id)}
                  onToggle={() => toggleAct(act.id)}
                  scenarioId={selectedScenario.id}
                />
              ))}

              <Button
                variant="subtle"
                leftSection={<IconPlus size={16} />}
                onClick={handleAddAct}
                disabled={!selectedScenarioId}
              >
                Add Act
              </Button>
            </Stack>
          </>
        ) : (
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Stack align="center" gap="md">
              <Text c="dimmed">No scenario selected</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleNewScenario}
              >
                Create Scenario
              </Button>
            </Stack>
          </Box>
        )}
      </Box>

      {/* AI Actions Panel */}
      <ScenarioAIPanel
        opened={aiPanelOpened}
        onClose={() => setAiPanelOpened(false)}
        scenario={selectedScenario}
      />
    </Box>
  );
}
