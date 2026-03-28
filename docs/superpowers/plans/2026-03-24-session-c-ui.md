# Session C: AI UI Components

> **For agentic workers:** Execute tasks in order. Depends on Sessions A and B.

**Goal:** Add AI version history UI, scenario-level AI generation, and panel regeneration to existing components.

**Dependencies:**
- Types from Session A
- Prompts from Session B
- Rust commands from Session B

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/components/panels/PanelHistoryDrawer.tsx` | Version history sidebar |
| `src/components/scenario/ScenarioAIGenerator.tsx` | Scenario-level AI modal |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/panels/PanelCard.tsx` | Add regenerate button, version badge |
| `src/components/panels/AiGenModal.tsx` | Add scenario mode |
| `src/components/panels/AddPanelModal.tsx` | Add version context to AI generation |
| `src/hooks/useClaude.ts` | Add useAIStore integration, new functions |
| `src/stores/aiStore.ts` | (modified in Session A) |

---

## Task 1: PanelHistoryDrawer.tsx

**Files:**
- Create: `src/components/panels/PanelHistoryDrawer.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Drawer, Text, Box, Button, Stack, Badge } from '@mantine/core';
import { IconHistory, IconRestore, IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { PanelVersion } from '@/types';

interface PanelHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  sceneId: string;
  panelId: string;
  versions: PanelVersion[];
  currentVersion: number;
}

export function PanelHistoryDrawer({
  opened,
  onClose,
  sceneId,
  panelId,
  versions,
  currentVersion,
}: PanelHistoryDrawerProps) {
  const { restorePanelVersion } = useProjectStore();

  const handleRestore = (version: number) => {
    restorePanelVersion(sceneId, panelId, version);
    onClose();
  };

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconHistory size={20} />
          <Text fw={500}>Panel Version History</Text>
        </Box>
      }
      position="right"
      size="md"
    >
      <Stack gap="md">
        {sortedVersions.length === 0 ? (
          <Text c="dimmed" size="sm">
            No version history yet.
          </Text>
        ) : (
          sortedVersions.map((v) => (
            <Box
              key={v.version}
              p="md"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r6)',
                background: v.version === currentVersion
                  ? 'var(--accent-dim)'
                  : 'var(--bg2)',
              }}
            >
              <Box style={{ display: 'flex', justifyContent: 'space-between', mb: 8 }}>
                <Badge
                  size="sm"
                  variant={v.version === currentVersion ? 'filled' : 'outline'}
                  color={v.version === currentVersion ? 'blue' : 'gray'}
                >
                  v{v.version}
                </Badge>
                <Text size="xs" c="dimmed">
                  {new Date(v.createdAt).toLocaleString()}
                </Text>
              </Box>

              <Text size="sm" mb="xs">
                <strong>Description:</strong> {v.description.slice(0, 100)}...
              </Text>

              <Text size="xs" c="dimmed" mb="xs">
                <strong>Shot:</strong> {v.shotType} | <strong>Duration:</strong> {v.duration}
              </Text>

              {v.generationMeta && (
                <Text size="xs" c="dimmed" mb="xs">
                  <strong>Model:</strong> {v.generationMeta.model || 'unknown'} |
                  <strong> Duration:</strong> {v.generationMeta.generationDurationMs}ms
                </Text>
              )}

              {v.version !== currentVersion && (
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconRestore size={14} />}
                  onClick={() => handleRestore(v.version)}
                >
                  Restore this version
                </Button>
              )}
            </Box>
          ))
        )}
      </Stack>
    </Drawer>
  );
}
```

---

## Task 2: PanelCard — Add regenerate button and version badge

**Files:**
- Modify: `src/components/panels/PanelCard.tsx`

- [ ] **Step 1: Add state and handlers**

Add imports:
```tsx
import { IconSparkles, IconHistory } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { PanelHistoryDrawer } from './PanelHistoryDrawer';
import { useAIStore } from '@/stores/aiStore';
```

Add to component:
```tsx
const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
const { addTask, getVersions } = useAIStore();

const panelVersions = getVersions(panel.id);
const hasVersions = panelVersions.length > 1;
```

- [ ] **Step 2: Add version badge and buttons to the card**

Find the sourceType badge section and add:
```tsx
{panel.sourceType === 'ai' && (
  <>
    <Badge
      size="xs"
      variant="light"
      color="grape"
      leftSection={<IconSparkles size={10} />}
    >
      AI
    </Badge>
    {hasVersions && (
      <Badge
        size="xs"
        variant="outline"
        color="gray"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          openHistory();
        }}
      >
        v{panel.version}
      </Badge>
    )}
  </>
)}
```

Add the drawer:
```tsx
<PanelHistoryDrawer
  opened={historyOpened}
  onClose={closeHistory}
  sceneId={scene.id}
  panelId={panel.id}
  versions={panelVersions}
  currentVersion={panel.version}
/>
```

- [ ] **Step 3: Add regenerate option to the context menu**

Find the menu items and add:
```tsx
<Menu.Item
  leftSection={<IconSparkles size={14} />}
  onClick={() => {
    setRegeneratingPanel(panel);
    setSelectedMethod('ai');
    open();
  }}
>
  Regenerate with AI
</Menu.Item>
```

---

## Task 3: ScenarioAIGenerator.tsx — New modal for scenario-level AI

**Files:**
- Create: `src/components/scenario/ScenarioAIGenerator.tsx`

- [ ] **Write the component**

```tsx
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
  const { addTask } = useAIStore();

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
        const scenarioId = addScenario(result.scenario.title || 'Untitled Scenario');

        // TODO: Parse acts/scenes from result.scenario and add to project

        addTask.update(taskId, { status: 'completed', progress: 100 });
        onClose();
      } else {
        addTask.update(taskId, {
          status: 'failed',
          message: result.error || 'Generation failed',
        });
      }
    } catch (error) {
      addTask.update(taskId, {
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
          <IconSparkles size={20} color="var(--accent)" />
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
            leftSection={<IconSparkles size={16} />}
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
```

---

## Task 4: AiGenModal — Add scenario mode

**Files:**
- Modify: `src/components/panels/AiGenModal.tsx`

- [ ] **Add scenario mode toggle**

Add state:
```tsx
const [generationMode, setGenerationMode] = useState<'scene' | 'scenario'>('scene');
```

Add toggle in header area:
```tsx
<Group gap="xs" mb="md">
  <Button
    size="xs"
    variant={generationMode === 'scene' ? 'filled' : 'outline'}
    onClick={() => setGenerationMode('scene')}
  >
    Scene
  </Button>
  <Button
    size="xs"
    variant={generationMode === 'scenario' ? 'filled' : 'outline'}
    onClick={() => setGenerationMode('scenario')}
  >
    Scenario
  </Button>
</Group>
```

Add scenario AI button:
```tsx
{generationMode === 'scenario' && (
  <Button
    fullWidth
    size="md"
    variant="light"
    leftSection={<IconSparkles size={16} />}
    onClick={() => setScenarioModalOpened(true)}
  >
    Generate Full Scenario with AI
  </Button>
)}
```

Import and add ScenarioAIGenerator:
```tsx
import { ScenarioAIGenerator } from '../scenario/ScenarioAIGenerator';

// Add to component JSX:
<ScenarioAIGenerator
  opened={scenarioModalOpened}
  onClose={() => setScenarioModalOpened(false)}
/>
```

---

## Task 5: useClaude.ts — Integrate with useAIStore and add new functions

**Files:**
- Modify: `src/hooks/useClaude.ts`

- [ ] **Add useAIStore integration**

Add import:
```tsx
import { useAIStore } from '@/stores/aiStore';
```

Add to function:
```tsx
const { addTask, updateTask } = useAIStore();
```

- [ ] **Add new functions**

```tsx
const generateScenario = async (
  concept: string,
  genre?: string,
  mood?: string
): Promise<{ success: boolean; scenario?: any; error?: string }> => {
  const taskId = addTask({
    type: 'generate_scenario',
    status: 'running',
    progress: 0,
    message: 'Generating scenario...',
  });

  try {
    const response = await invoke<{
      title: string;
      logline: string;
      acts: any[];
    }>('generate_scenario', {
      request: { concept, genre, mood },
    });

    updateTask(taskId, { status: 'completed', progress: 100 });
    return { success: true, scenario: response };
  } catch (error) {
    updateTask(taskId, {
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const regeneratePanel = async (
  panelId: string,
  previousSvg: string,
  previousDescription: string,
  userFeedback: string,
  sceneContext?: string
): Promise<{ success: boolean; svg_data?: string; error?: string }> => {
  const taskId = addTask({
    type: 'regenerate_panel',
    status: 'running',
    progress: 0,
    message: 'Regenerating panel...',
    metadata: { panelId },
  });

  try {
    const response = await invoke<{
      svg_data: string | null;
      success: boolean;
      error?: string;
    }>('regenerate_panel', {
      request: {
        previous_svg: previousSvg,
        previous_description: previousDescription,
        user_feedback: userFeedback,
        scene_context: sceneContext,
      },
    });

    if (response.success) {
      updateTask(taskId, { status: 'completed', progress: 100 });
    } else {
      updateTask(taskId, { status: 'failed', message: response.error });
    }

    return response;
  } catch (error) {
    updateTask(taskId, {
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

return {
  checkAvailability,
  generatePanel,
  generateScriptLines,
  generateDescriptionSuggestion,
  batchGeneratePanels,
  generateScenario,        // NEW
  regeneratePanel,         // NEW
};
```

---

## Task 6: Commit

```bash
git add \
  src/components/panels/PanelHistoryDrawer.tsx \
  src/components/panels/PanelCard.tsx \
  src/components/scenario/ScenarioAIGenerator.tsx \
  src/components/panels/AiGenModal.tsx \
  src/hooks/useClaude.ts
git commit -m "feat(ui): add AI version history and scenario-level generation

- Add PanelHistoryDrawer for version browsing and restore
- Add regenerate button and version badge to PanelCard
- Add ScenarioAIGenerator modal for scenario-level AI
- Update AiGenModal with scenario mode toggle
- Integrate useClaude with useAIStore
- Add generateScenario and regeneratePanel to useClaude

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
