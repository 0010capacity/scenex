# Session D: Scenario/Script Editor

> **For agentic workers:** Execute tasks in order. Depends on Sessions A, B, C.

**Goal:** Create the scenario editor with markdown script writing and bidirectional scenario↔storyboard conversion.

**Dependencies:**
- Types from Session A
- Prompts from Session B
- Rust commands from Session B

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/components/scenario/ScenarioEditor.tsx` | Main scenario editor with act/scene hierarchy |
| `src/components/scenario/ScenarioMarkdownEditor.tsx` | Markdown editor for script writing |
| `src/components/scenario/ScenarioAIPanel.tsx` | AI actions sidebar for scenario |
| `src/components/scenario/ActEditor.tsx` | Individual act editor |
| `src/components/scenario/SceneEditor.tsx` | Individual scene editor |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add scenario editor route/tab |
| `src/stores/projectStore.ts` | (modified in Session A) |

---

## Task 1: ScenarioEditor.tsx — Main scenario layout

**Files:**
- Create: `src/components/scenario/ScenarioEditor.tsx`

- [ ] **Write the component**

```tsx
import { Box, Text, Button, Stack, ActionIcon, Group, Drawer, useDisclosure } from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconSparkles,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Scenario, Act, Scene } from '@/types';
import { ActEditor } from './ActEditor';
import { ScenarioAIPanel } from './ScenarioAIPanel';

export function ScenarioEditor() {
  const { project, addAct, updateScenario, deleteScenario } = useProjectStore();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [aiPanelOpened, { open: openAIPanel, close: closeAIPanel }] = useDisclosure(false);

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
            onClick={() => {
              const name = prompt('Scenario name:');
              if (name) {
                const id = useProjectStore.getState().addScenario(name);
                setSelectedScenarioId(id);
              }
            }}
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
                <Text
                  size="xl"
                  fw={600}
                  editable
                  onEdit={(newName) =>
                    updateScenario(selectedScenario.id, { name: newName })
                  }
                >
                  {selectedScenario.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {selectedScenario.description || 'No description'}
                </Text>
              </Box>
              <Group>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconSparkles size={16} />}
                  onClick={openAIPanel}
                >
                  AI Actions
                </Button>
              </Group>
            </Group>

            {/* Acts List */}
            <Stack gap="md">
              {selectedScenario.acts.map((act, index) => (
                <ActEditor
                  key={act.id}
                  act={act}
                  index={index}
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
                onClick={() => {
                  const name = prompt('Scenario name:');
                  if (name) {
                    const id = useProjectStore.getState().addScenario(name);
                    setSelectedScenarioId(id);
                  }
                }}
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
        onClose={closeAIPanel}
        scenario={selectedScenario}
      />
    </Box>
  );
}
```

---

## Task 2: ActEditor.tsx — Individual act display/edit

**Files:**
- Create: `src/components/scenario/ActEditor.tsx`

- [ ] **Write the component**

```tsx
import {
  Box,
  Text,
  Collapse,
  Group,
  ActionIcon,
  Badge,
  Stack,
} from '@mantine/core';
import { IconChevronRight, IconChevronDown, IconTrash, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Act, Scene } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { SceneEditor } from './SceneEditor';

interface ActEditorProps {
  act: Act;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  scenarioId: string;
}

export function ActEditor({ act, index, expanded, onToggle, scenarioId }: ActEditorProps) {
  const { updateAct, addScene } = useProjectStore();

  const handleAddScene = () => {
    if (scenarioId) {
      addScene(scenarioId, act.id, `Scene ${act.scenes.length + 1}`);
    }
  };

  const totalDuration = act.scenes.reduce((sum, s) => {
    // Parse duration from scene if available
    return sum + 3; // default 3 min per scene
  }, 0);

  return (
    <Box
      className="act-editor"
      p="md"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r8)',
        background: 'var(--bg2)',
      }}
    >
      {/* Act Header */}
      <Group
        onClick={onToggle}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        mb={expanded ? 'md' : 0}
      >
        {expanded ? (
          <IconChevronDown size={18} />
        ) : (
          <IconChevronRight size={18} />
        )}
        <Text fw={600} size="sm">
          {act.name}
        </Text>
        <Badge size="sm" variant="outline" ml="auto">
          {act.scenes.length} scenes
        </Badge>
        <Text size="xs" c="dimmed" ml="xs">
          ~{totalDuration} min
        </Text>
      </Group>

      {/* Synopsis (editable) */}
      {expanded && (
        <Box mb="md" pl={26}>
          <Text
            size="xs"
            c="dimmed"
            mb={4}
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Synopsis
          </Text>
          <Text
            size="sm"
            editable
            onEdit={(newSynopsis) =>
              updateAct(scenarioId, act.id, { synopsis: newSynopsis })
            }
          >
            {act.synopsis || 'Click to add synopsis...'}
          </Text>
        </Box>
      )}

      {/* Scenes */}
      <Collapse in={expanded}>
        <Stack gap="xs" pl={26}>
          {act.scenes.map((scene, sceneIndex) => (
            <SceneEditor
              key={scene.id}
              scene={scene}
              index={sceneIndex}
              actId={act.id}
              scenarioId={scenarioId}
            />
          ))}

          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddScene}
          >
            Add Scene
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
}
```

---

## Task 3: SceneEditor.tsx — Individual scene editor

**Files:**
- Create: `src/components/scenario/SceneEditor.tsx`

- [ ] **Write the component**

```tsx
import { Box, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconTrash, IconEdit } from '@tabler/icons-react';
import { Scene } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

interface SceneEditorProps {
  scene: Scene;
  index: number;
  actId: string;
  scenarioId: string;
}

export function SceneEditor({ scene, index, actId, scenarioId }: SceneEditorProps) {
  const { updateScene, deleteScene } = useProjectStore();

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
            onClick={() => deleteScene(scenarioId, actId, scene.id)}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
```

---

## Task 4: ScenarioAIPanel.tsx — AI actions sidebar

**Files:**
- Create: `src/components/scenario/ScenarioAIPanel.tsx`

- [ ] **Write the component**

```tsx
import {
  Drawer,
  Text,
  Button,
  Stack,
  Group,
  Select,
  Textarea,
  Progress,
  Box,
  Badge,
} from '@mantine/core';
import { IconSparkles, IconHistory, IconFileExport } from '@tabler/icons-react';
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
  const { updateScenario } = useProjectStore();
  const { addTask } = useAIStore();

  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAIAction = async () => {
    if (!scenario || !selectedAction) return;

    setIsProcessing(true);
    setProgress(10);

    const taskId = addTask({
      type: selectedAction === 'toStoryboard' ? 'scenario_to_storyboard' : `${selectedAction}_scenario`,
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
          updateScenario(scenario.id, resultObj.scenario);
        }
      }

      addTask.update(taskId, { status: 'completed', progress: 100 });
      setProgress(100);
    } catch (error) {
      addTask.update(taskId, {
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
          <IconSparkles size={20} color="var(--accent)" />
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
                {scenario.acts.length} acts,{' '}
                {scenario.acts.reduce((sum, a) => sum + a.scenes.length, 0)} scenes
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
              leftSection={<IconSparkles size={16} />}
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
```

---

## Task 5: App.tsx — Add scenario editor tab/route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Add scenario editor to the app**

Find where tabs/pages are defined and add:

```tsx
import { ScenarioEditor } from './components/scenario/ScenarioEditor';

// Add tab for scenario
<Tabs.List>
  <Tabs.Tab value="storyboard">Storyboard</Tabs.Tab>
  <Tabs.Tab value="scenario">Scenario</Tabs.Tab>
  {/* other tabs */}
</Tabs.List>

<Tabs.Panel value="scenario">
  <ScenarioEditor />
</Tabs.Panel>
```

---

## Task 6: Commit

```bash
git add \
  src/components/scenario/ScenarioEditor.tsx \
  src/components/scenario/ActEditor.tsx \
  src/components/scenario/SceneEditor.tsx \
  src/components/scenario/ScenarioAIPanel.tsx \
  src/App.tsx
git commit -m "feat(scenario): add scenario editor with act/scene hierarchy

- Add ScenarioEditor with sidebar navigation
- Add ActEditor with collapsible scenes
- Add SceneEditor with panel count badges
- Add ScenarioAIPanel with polish/expand/condense/storyboard actions
- Wire up scenario tabs in App.tsx

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
