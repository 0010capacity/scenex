import { Box, Text, Menu, Badge } from '@mantine/core';
import { IconPlayerPlay, IconArrowMoveRight, IconSparkles, IconHistory } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDisclosure } from '@mantine/hooks';
import { Panel } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';
import { PanelHistoryDrawer } from './PanelHistoryDrawer';

interface PanelCardProps {
  panel: Panel;
  sceneId: string;
  width: number;
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

export function PanelCard({ panel, sceneId, width, variant = 'grid' }: PanelCardProps) {
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

  const otherScenes = project?.scenes.filter((s) => s.id !== sceneId) ?? [];

  const handleMoveToScene = (toSceneId: string) => {
    movePanel(panel.id, toSceneId);
  };

  // Version history
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const { getVersions } = useAIStore();
  const panelVersions = getVersions(panel.id);
  const hasVersions = panelVersions.length > 1;

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
          border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: isSelected ? '0 0 0 2px var(--accent-dim), 0 0 0 1px var(--accent)' : undefined,
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
            <IconPlayerPlay size={14} color="var(--text3)" stroke={1.5} />
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
    <>
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Box
      ref={setNodeRef}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--r8)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg2)',
        border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 0 2px var(--accent-dim), 0 0 0 1px var(--accent)' : undefined,
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
      <Box className="panel-drag-handle" />

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
        <Box style={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: 4 }}>
          {panel.sourceType === 'ai' && (
            <>
              <Badge
                size="xs"
                variant="light"
                color="grape"
                leftSection={<IconSparkles size={10} stroke={1.5} />}
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
                  leftSection={<IconHistory size={10} stroke={1.5} />}
                >
                  v{panel.version}
                </Badge>
              )}
            </>
          )}
          {panel.sourceType !== 'ai' && (
            <Badge
              size="xs"
              variant="light"
              color={panel.sourceType === 'imported' ? 'violet' : 'gray'}
            >
              {sourceLabel}
            </Badge>
          )}
        </Box>

        {/* Hover overlay */}
        <Box
          className="frame-overlay"
          style={{
            inset: 0,
          }}
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
      <Box className="panel-meta">
        <Text className="panel-shot">
          {panel.shotType
            ? `${panel.shotType} — ${shotDesc}`
            : '빈 패널'}
        </Text>

        {panel.description && (
          <Text className="panel-desc">
            {panel.description}
          </Text>
        )}

        <Box className="panel-footer">
          <Box className="panel-tag">
            {panel.number}
          </Box>
          {panel.duration && (
            <Box className="panel-tag dur">
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
              leftSection={<IconArrowMoveRight size={14} stroke={1.5} />}
            >
              S{project!.scenes.findIndex(s => s.id === scene.id) + 1} — {scene.name}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>이동할 장면이 없습니다</Menu.Item>
        )}
        {panel.sourceType === 'ai' && (
          <>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconSparkles size={14} stroke={1.5} />}
              onClick={() => {
                // TODO: Open regenerate modal
                console.log('Regenerate panel', panel.id);
              }}
            >
              AI로 재생성
            </Menu.Item>
            {hasVersions && (
              <Menu.Item
                leftSection={<IconHistory size={14} stroke={1.5} />}
                onClick={openHistory}
              >
                버전 기록
              </Menu.Item>
            )}
          </>
        )}
      </Menu.Dropdown>
    </Menu>

    <PanelHistoryDrawer
      opened={historyOpened}
      onClose={closeHistory}
      panelId={panel.id}
      versions={panelVersions}
      currentVersion={panel.version ?? 1}
    />
    </>
  );
}
