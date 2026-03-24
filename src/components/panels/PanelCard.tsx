import { Box, Text, Menu } from '@mantine/core';
import { IconPlayerPlay, IconArrowMoveRight } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

interface PanelCardProps {
  panel: Panel;
  sceneId: string;
  width: number;
  showDetails?: boolean;
  variant?: 'grid' | 'list';
}

const SHOT_LABELS: Record<string, string> = {
  EWS: '익스트림 와이드',
  WS: '와이드',
  MS: '미디엄',
  CU: '클로즈업',
  ECU: '익스트림 CU',
  OTS: '오버더숄더',
  POV: '시점',
};

const SOURCE_LABELS: Record<string, string> = {
  ai: 'AI',
  manual: '수동',
  imported: '임포트',
  empty: '빈 패널',
};

export function PanelCard({ panel, sceneId, width, showDetails = false, variant = 'grid' }: PanelCardProps) {
  const { selectedPanelId, selectPanel, project, movePanel } = useProjectStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panel.id });

  const isSelected = selectedPanelId === panel.id;
  const height = width * (9 / 16);

  const shotDesc = panel.shotType ? SHOT_LABELS[panel.shotType] ?? '' : '';
  const sourceLabel = SOURCE_LABELS[panel.sourceType] ?? '';
  const sourceClass = panel.sourceType === 'ai' ? 'badge-ai' : panel.sourceType === 'imported' ? 'badge-imported' : 'badge-manual';

  const otherScenes = project?.scenes.filter((s) => s.id !== sceneId) ?? [];

  const handleMoveToScene = (toSceneId: string) => {
    movePanel(panel.id, toSceneId);
  };

  // List variant - horizontal layout with prominent drag handle
  if (variant === 'list') {
    return (
      <Box
        ref={setNodeRef}
        style={{
          display: 'flex',
          gap: 12,
          padding: '10px 12px',
          backgroundColor: 'var(--bg2)',
          borderRadius: 'var(--r8)',
          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: isSelected ? '0 0 0 1px var(--accent)' : undefined,
          opacity: isDragging ? 0.5 : 1,
          transform: CSS.Transform.toString(transform),
          transition,
          cursor: 'pointer',
        }}
        onClick={() => selectPanel(panel.id)}
        {...attributes}
        {...listeners}
      >
        {/* Drag handle */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            cursor: 'grab',
            color: 'var(--text3)',
          }}
        >
          ⋮⋮
        </Box>

        {/* Thumbnail */}
        <Box
          style={{
            width: 80,
            height: 45,
            backgroundColor: 'var(--bg3)',
            borderRadius: 'var(--r4)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {panel.imageData ? (
            <img src={panel.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : panel.svgData ? (
            <Box dangerouslySetInnerHTML={{ __html: panel.svgData }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <IconPlayerPlay size={14} color="var(--text3)" />
          )}
        </Box>

        {/* Content */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
              P{String(panel.number).padStart(2, '0')}
            </Text>
            {panel.shotType && (
              <Text style={{ fontSize: 10, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>
                {panel.shotType}
              </Text>
            )}
            <Text style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {panel.duration || '3s'}
            </Text>
          </Box>
          {panel.description && (
            <Text style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }} className="line-clamp-2">
              {panel.description}
            </Text>
          )}
          {panel.dialogue && (
            <Text style={{ fontSize: 10, color: 'var(--accent)', fontStyle: 'italic', marginTop: 2 }}>
              "{panel.dialogue}"
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Box
      ref={setNodeRef}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--r8)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg2)',
        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 0 1px var(--accent)' : undefined,
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        width: '100%',
      }}
      onClick={() => selectPanel(panel.id)}
      {...attributes}
      {...listeners}
    >
      {/* Drag handle */}
      <Box
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: 'transparent',
          cursor: 'grab',
          zIndex: 2,
          transition: 'background 0.15s',
        }}
        className="drag-handle"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Panel frame */}
      <Box
        style={{
          width: '100%',
          height: height,
          backgroundColor: 'var(--bg3)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Image */}
        {panel.imageData ? (
          <img
            src={panel.imageData}
            alt={`Panel ${panel.number}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : panel.svgData ? (
          <Box
            dangerouslySetInnerHTML={{ __html: panel.svgData }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* Empty state */
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--bg2)',
            }}
          >
            <IconPlayerPlay size={20} color="var(--text3)" stroke={1.5} />
            <Text style={{ fontSize: 9, color: 'var(--text3)', opacity: 0.6 }}>
              빈 프레임
            </Text>
          </Box>
        )}

        {/* Panel number */}
        <Box
          style={{
            position: 'absolute',
            top: 5,
            left: 6,
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--text3)',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '1px 5px',
            borderRadius: 2,
          }}
        >
          {String(panel.number).padStart(2, '0')}
        </Box>

        {/* Shot type tag (bottom-right) */}
        {panel.shotType && (
          <Box
            style={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              fontSize: 9,
              color: 'var(--blue)',
              background: 'var(--blue-dim)',
              padding: '1px 5px',
              borderRadius: 2,
              fontFamily: 'var(--mono)',
              border: '1px solid rgba(91, 141, 239, 0.2)',
            }}
          >
            {panel.shotType}
          </Box>
        )}

        {/* Source badge (top-right) */}
        <Box
          className={`panel-type-badge ${sourceClass}`}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            fontSize: 8,
            padding: '1px 5px',
            borderRadius: 2,
            fontFamily: 'var(--mono)',
            border: '1px solid currentColor',
            background: panel.sourceType === 'ai' ? 'var(--accent-dim)' : panel.sourceType === 'imported' ? 'var(--purple-dim)' : undefined,
            color: panel.sourceType === 'ai' ? 'var(--accent)' : panel.sourceType === 'imported' ? 'var(--purple)' : 'var(--text3)',
          }}
        >
          {sourceLabel}
        </Box>

        {/* Hover overlay */}
        <Box
          className="frame-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0)',
            transition: 'background 0.2s',
            opacity: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)', e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0)', e.currentTarget.style.opacity = '0')}
        >
          <button
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: 'var(--r4)',
              fontSize: 11,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectPanel(panel.id);
            }}
          >
            편집
          </button>
        </Box>
      </Box>

      {/* Panel meta */}
      <Box style={{ padding: '8px 10px 10px' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text)',
            marginBottom: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {panel.shotType
            ? `${panel.shotType} — ${shotDesc}`
            : '빈 패널'}
        </Text>

        {panel.description && (
          <Text
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: showDetails ? 'auto' : 28,
            }}
          >
            {panel.description}
          </Text>
        )}

        <Box style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <Box
            style={{
              fontSize: 9,
              padding: '2px 5px',
              borderRadius: 2,
              fontFamily: 'var(--mono)',
              background: 'var(--bg4)',
              color: 'var(--text3)',
            }}
          >
            {panel.number}
          </Box>
          {panel.duration && (
            <Box
              style={{
                fontSize: 9,
                padding: '2px 5px',
                borderRadius: 2,
                fontFamily: 'var(--mono)',
                background: 'var(--bg4)',
                color: 'var(--text2)',
              }}
            >
              {panel.duration}
            </Box>
          )}
        </Box>
      </Box>
      </Box>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>장면 이동</Menu.Label>
        {otherScenes.length > 0 ? (
          otherScenes.map((scene) => (
            <Menu.Item
              key={scene.id}
              onClick={() => handleMoveToScene(scene.id)}
              leftSection={<IconArrowMoveRight size={14} />}
            >
              S{project!.scenes.findIndex(s => s.id === scene.id) + 1} — {scene.name}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>이동할 장면이 없습니다</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
