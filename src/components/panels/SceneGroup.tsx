import { useState } from 'react';
import { Box, Group, Text, TextInput } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { Scene } from '@/types';
import { PanelGrid } from './PanelGrid';
import { calculateSceneDuration } from '@/utils/duration';
import { useProjectStore } from '@/stores/projectStore';

interface SceneGroupProps {
  scene: Scene;
  viewMode: 'grid' | 'list' | 'strip' | 'slide';
}

export function SceneGroup({ scene, viewMode }: SceneGroupProps) {
  const updateScene = useProjectStore(s => s.updateScene);
  const duration = calculateSceneDuration(scene.panels);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(scene.name);

  // Scene index from 1
  const sceneIndex = scene.name.match(/^S(\d+)/)?.[1] ?? '?';

  const handleStartEdit = () => {
    setEditName(scene.name);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== scene.name) {
      updateScene(scene.id, { name: trimmed });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(scene.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Box className="scene-group">
      {/* Scene header */}
      <Group className="scene-row" mb={12} align="center" gap={10}>
        <Box className="scene-chip">{sceneIndex}</Box>
        {isEditing ? (
          <TextInput
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            size="sm"
            classNames={{ input: 'scene-name-input' }}
            style={{ flex: '0 1 auto', minWidth: 120 }}
          />
        ) : (
          <>
            <Text className="scene-name">{scene.name}</Text>
            <Text className="scene-dur">{duration}</Text>
            <Box className="scene-line" />
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleStartEdit}
              title="이름 편집"
            >
              <IconPencil size={16} />
            </button>
          </>
        )}
      </Group>

      {/* Panel grid */}
      <PanelGrid
        panels={scene.panels}
        sceneId={scene.id}
        viewMode={viewMode}
      />
    </Box>
  );
}
