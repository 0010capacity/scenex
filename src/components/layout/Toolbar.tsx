import {
  Group,
  ActionIcon,
  Select,
  Button,
  Slider,
  Tooltip,
  Box,
  Text,
} from '@mantine/core';
import {
  IconPlus,
  IconFolder,
  IconDeviceFloppy,
  IconDownload,
  IconLayoutGrid,
  IconList,
  IconZoomIn,
  IconZoomOut,
  IconChevronDown,
} from '@tabler/icons-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useProject } from '@/hooks/useProject';

export function Toolbar() {
  const { project, addScene, selectedSceneId, selectScene } = useProjectStore();
  const {
    zoomLevel,
    setZoomLevel,
    viewMode,
    setViewMode,
    openAddPanelModal,
  } = useUIStore();
  const { saveProject, isDirty } = useProject();

  const sceneOptions =
    project?.scenes.map((s) => ({
      value: s.id,
      label: s.name,
    })) ?? [];

  return (
    <Box
      style={{
        height: 48,
        backgroundColor: '#13141A',
        borderBottom: '1px solid #2A2826',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
      }}
    >
      {/* Left section - File operations */}
      <Group gap={4}>
        <Tooltip label="New Project">
          <ActionIcon
            variant="subtle"
            size="lg"
            color="gray"
            onClick={() => {
              if (window.confirm('Create a new project? Unsaved changes will be lost.')) {
                useProjectStore.getState().newProject('My Storyboard');
              }
            }}
          >
            <IconFolder size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={isDirty ? 'Save (Cmd+S)' : 'Save'}>
          <ActionIcon
            variant="subtle"
            size="lg"
            color={isDirty ? 'gold' : 'gray'}
            onClick={() => saveProject()}
          >
            <IconDeviceFloppy size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Box style={{ width: 1, height: 24, backgroundColor: '#2A2826' }} />

      {/* Scene selector */}
      <Select
        value={selectedSceneId}
        onChange={(value) => value && selectScene(value)}
        data={sceneOptions}
        placeholder="Select scene"
        size="sm"
        style={{ width: 200 }}
        rightSection={<IconChevronDown size={14} />}
      />

      {/* Add scene button */}
      <Button
        size="compact-sm"
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addScene()}
      >
        Add Scene
      </Button>

      <Box style={{ flex: 1 }} />

      {/* Add panel button */}
      <Button
        size="compact-sm"
        variant="filled"
        color="gold"
        leftSection={<IconPlus size={16} />}
        onClick={() => selectedSceneId && openAddPanelModal(selectedSceneId)}
        disabled={!selectedSceneId}
      >
        Add Panel
      </Button>

      <Box style={{ width: 1, height: 24, backgroundColor: '#2A2826' }} />

      {/* View toggle */}
      <Group gap={4}>
        <ActionIcon
          variant={viewMode === 'grid' ? 'light' : 'subtle'}
          size="lg"
          color={viewMode === 'grid' ? 'gold' : 'gray'}
          onClick={() => setViewMode('grid')}
        >
          <IconLayoutGrid size={20} />
        </ActionIcon>
        <ActionIcon
          variant={viewMode === 'list' ? 'light' : 'subtle'}
          size="lg"
          color={viewMode === 'list' ? 'gold' : 'gray'}
          onClick={() => setViewMode('list')}
        >
          <IconList size={20} />
        </ActionIcon>
      </Group>

      {/* Zoom controls */}
      <Group gap={8}>
        <ActionIcon
          variant="subtle"
          size="lg"
          color="gray"
          onClick={() => setZoomLevel(zoomLevel - 10)}
        >
          <IconZoomOut size={18} />
        </ActionIcon>
        <Slider
          value={zoomLevel}
          onChange={setZoomLevel}
          min={50}
          max={200}
          step={10}
          style={{ width: 100 }}
          label={null}
          color="gold"
        />
        <ActionIcon
          variant="subtle"
          size="lg"
          color="gray"
          onClick={() => setZoomLevel(zoomLevel + 10)}
        >
          <IconZoomIn size={18} />
        </ActionIcon>
        <Text size="xs" c="dimmed" style={{ width: 36 }}>
          {zoomLevel}%
        </Text>
      </Group>

      <Box style={{ width: 1, height: 24, backgroundColor: '#2A2826' }} />

      {/* Export */}
      <Tooltip label="Export">
        <ActionIcon variant="subtle" size="lg" color="gray">
          <IconDownload size={20} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}
