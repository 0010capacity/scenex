import {
  Box,
  Text,
  Collapse,
  Group,
  Badge,
  Stack,
} from '@mantine/core';
import { IconChevronRight, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { useState } from 'react';
import { Act } from '@/types/scenario';
import { useProjectStore } from '@/stores/projectStore';
import { SceneEditor } from './SceneEditor';

interface ActEditorProps {
  act: Act;
  expanded: boolean;
  onToggle: () => void;
  scenarioId: string;
}

export function ActEditor({ act, expanded, onToggle, scenarioId }: ActEditorProps) {
  const { updateAct, addSceneToAct } = useProjectStore();
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [synopsisText, setSynopsisText] = useState(act.synopsis);

  const handleAddScene = () => {
    if (scenarioId) {
      addSceneToAct(scenarioId, act.id, `Scene ${act.scenes.length + 1}`);
    }
  };

  const handleSaveSynopsis = () => {
    updateAct(scenarioId, act.id, { synopsis: synopsisText });
    setIsEditingSynopsis(false);
  };

  const totalDuration = act.scenes.reduce((sum) => sum + 3, 0); // default 3 min per scene

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
          {isEditingSynopsis ? (
            <Box>
              <textarea
                value={synopsisText}
                onChange={(e) => setSynopsisText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 60,
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <Group mt={4}>
                <Button size="xs" onClick={handleSaveSynopsis}>Save</Button>
                <Button size="xs" variant="subtle" onClick={() => setIsEditingSynopsis(false)}>Cancel</Button>
              </Group>
            </Box>
          ) : (
            <Text
              size="sm"
              onClick={() => setIsEditingSynopsis(true)}
              style={{ cursor: 'pointer' }}
            >
              {act.synopsis || 'Click to add synopsis...'}
            </Text>
          )}
        </Box>
      )}

      {/* Scenes */}
      <Collapse in={expanded}>
        <Stack gap="xs" pl={26}>
          {act.scenes.map((scene) => (
            <SceneEditor
              key={scene.id}
              scene={scene}
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
