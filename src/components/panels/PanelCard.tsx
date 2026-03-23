import { Box, Text, Badge, Group, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, SHOT_TYPE_OPTIONS, MOOD_TAG_OPTIONS } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

interface PanelCardProps {
  panel: Panel;
  sceneId: string;
  width: number;
  showDetails?: boolean;
}

export function PanelCard({ panel, sceneId: _sceneId, width, showDetails = false }: PanelCardProps) {
  const { selectedPanelId, selectPanel, deletePanel } = useProjectStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panel.id });

  const isSelected = selectedPanelId === panel.id;
  const height = width * (9 / 16); // 16:9 aspect ratio

  const shotTypeLabel = SHOT_TYPE_OPTIONS.find(
    (o) => o.value === panel.shotType
  )?.label;

  const handleClick = () => {
    selectPanel(panel.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePanel(panel.id);
  };

  const style = {
    cursor: 'pointer',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1A1C24',
    border: isSelected ? '2px solid #E8A838' : '2px solid transparent',
    transition: transition,
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {/* Panel frame */}
      <Box
        className="panel-frame"
        style={{
          width: '100%',
          height: height,
          backgroundColor: '#0B0C10',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Image or placeholder */}
        {panel.imageData ? (
          <img
            src={panel.imageData}
            alt={`Panel ${panel.number}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : panel.svgData ? (
          <div
            dangerouslySetInnerHTML={{ __html: panel.svgData }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Box
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#13141A',
              color: '#4E4C48',
            }}
          >
            <IconPlayerPlay size={32} stroke={1} />
          </Box>
        )}

        {/* Panel number badge */}
        <Badge
          size="sm"
          variant="filled"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#E8E5DC',
          }}
        >
          {panel.number}
        </Badge>

        {/* Duration badge */}
        {panel.duration && (
          <Badge
            size="xs"
            variant="filled"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#9A9790',
            }}
          >
            {panel.duration}
          </Badge>
        )}

        {/* Hover actions */}
        <Box
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.15s ease',
          }}
          className="panel-actions"
        >
          <ActionIcon
            size="sm"
            variant="filled"
            color="red"
            onClick={handleDelete}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Box>
      </Box>

      {/* Panel info */}
      <Box style={{ padding: '8px 12px' }}>
        <Group gap={6} wrap="wrap">
          {shotTypeLabel && (
            <Badge size="xs" variant="light" color="gray">
              {shotTypeLabel}
            </Badge>
          )}
          {panel.cameraMovement && (
            <Badge size="xs" variant="outline" color="gray">
              {panel.cameraMovement}
            </Badge>
          )}
          {panel.moodTags.map((tag) => {
            const mood = MOOD_TAG_OPTIONS.find((o) => o.value === tag);
            return (
              <Badge
                key={tag}
                size="xs"
                style={{ backgroundColor: mood?.color, color: '#0B0C10' }}
              >
                {mood?.label}
              </Badge>
            );
          })}
        </Group>

        {showDetails && panel.description && (
          <Text size="xs" c="dimmed" mt={8} lineClamp={2}>
            {panel.description}
          </Text>
        )}
      </Box>

      <style>{`
        .panel-frame:hover .panel-actions {
          opacity: 1;
        }
      `}</style>
    </Box>
  );
}
