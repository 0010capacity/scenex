import { Group, Text, Badge, Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

export function TitleBar() {
  const { claudeStatus } = useUIStore();
  const { project, isDirty } = useProjectStore();

  const getStatusColor = () => {
    switch (claudeStatus) {
      case 'available':
        return 'green';
      case 'unavailable':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = () => {
    switch (claudeStatus) {
      case 'available':
        return 'AI Ready';
      case 'unavailable':
        return 'AI Offline';
      default:
        return 'Checking...';
    }
  };

  return (
    <Box
      style={{
        height: 38,
        backgroundColor: '#13141A',
        borderBottom: '1px solid #2A2826',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 80, // Space for traffic lights
        paddingRight: 16,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <Group gap="xs" align="center">
        <Text
          size="sm"
          fw={600}
          style={{ fontFamily: "'Playfair Display', serif", color: '#E8E5DC' }}
        >
          SceneX
        </Text>
        {project && (
          <>
            <Text size="sm" c="dimmed">
              —
            </Text>
            <Text size="sm" c="dimmed">
              {project.name}
              {isDirty ? ' •' : ''}
            </Text>
          </>
        )}
      </Group>
      <Box style={{ position: 'absolute', right: 16 }}>
        <Badge
          size="sm"
          variant="light"
          color={getStatusColor()}
          style={{ textTransform: 'none' }}
        >
          {getStatusLabel()}
        </Badge>
      </Box>
    </Box>
  );
}
