import { Drawer, Text, Box, Button, Stack, Badge } from '@mantine/core';
import { IconHistory, IconRestore } from '@tabler/icons-react';
import { AITaskVersion } from '@/types/ai';

interface PanelHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  panelId: string;
  versions: AITaskVersion[];
  currentVersion: number;
}

export function PanelHistoryDrawer({
  opened,
  onClose,
  panelId,
  versions,
  currentVersion,
}: PanelHistoryDrawerProps) {
  const handleRestore = (version: number) => {
    // TODO: Call restorePanelVersion
    console.log('Restore version', version, 'for panel', panelId);
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
              <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
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
                <strong>Description:</strong> {v.description?.slice(0, 100)}...
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
