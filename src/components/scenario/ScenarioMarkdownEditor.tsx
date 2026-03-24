import { Box, Textarea, Button, Group } from '@mantine/core';
import { useState } from 'react';
import { ScenarioScene } from '@/types/scenario';
import { useProjectStore } from '@/stores/projectStore';

interface ScenarioMarkdownEditorProps {
  scene: ScenarioScene;
  actId: string;
  scenarioId: string;
}

export function ScenarioMarkdownEditor({ scene, actId, scenarioId }: ScenarioMarkdownEditorProps) {
  const { updateSceneInAct } = useProjectStore();
  const [content, setContent] = useState(scene.description || '');

  const handleSave = () => {
    updateSceneInAct(scenarioId, actId, scene.id, {
      description: content,
    });
  };

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Textarea
        style={{ flex: 1 }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your scene script in markdown..."
        autosize
        minRows={10}
      />
      <Group mt="sm">
        <Button onClick={handleSave}>Save</Button>
      </Group>
    </Box>
  );
}
