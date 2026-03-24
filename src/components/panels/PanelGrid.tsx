import { Box, ActionIcon, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { Panel } from '@/types';
import { PanelCard } from './PanelCard';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface PanelGridProps {
  panels: Panel[];
  sceneId: string;
  viewMode: 'grid' | 'list' | 'strip' | 'slide';
}

export function PanelGrid({ panels, sceneId, viewMode }: PanelGridProps) {
  const { reorderPanels } = useProjectStore();
  const { openAddPanelModal, openAiGenModal } = useUIStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = panels.findIndex((p) => p.id === active.id);
      const newIndex = panels.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderPanels(sceneId, oldIndex, newIndex);
      }
    }
  };

  // Empty state
  if (panels.length === 0) {
    return (
      <Box
        style={{
          padding: '32px 0 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 12, color: 'var(--text3)' }}>
          이 장면에는 아직 패널이 없어요.
        </Text>
        <Box style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              padding: '6px 12px',
              borderRadius: 'var(--r6)',
              fontSize: 11,
              cursor: 'pointer',
            }}
            onClick={() => openAddPanelModal(sceneId)}
          >
            + 패널 추가
          </button>
          <button
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: 'var(--accent)',
              padding: '6px 12px',
              borderRadius: 'var(--r6)',
              fontSize: 11,
              cursor: 'pointer',
            }}
            onClick={openAiGenModal}
          >
            ✦ AI로 자동 생성
          </button>
        </Box>
      </Box>
    );
  }

  // Slide view
  if (viewMode === 'slide') {
    const currentPanel = panels[slideIndex];
    if (!currentPanel) return null;

    const navigate = (dir: number) => {
      setSlideIndex((prev) => {
        const next = prev + dir;
        if (next < 0) return panels.length - 1;
        if (next >= panels.length) return 0;
        return next;
      });
    };

    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          gap: 16,
          padding: 24,
        }}
      >
        <ActionIcon
          size="xl"
          variant="filled"
          color="gray"
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
        >
          <IconChevronLeft size={20} />
        </ActionIcon>

        <Box style={{ width: 400, maxWidth: '100%' }}>
          <PanelCard panel={currentPanel} sceneId={sceneId} width={400} />
        </Box>

        <ActionIcon
          size="xl"
          variant="filled"
          color="gray"
          onClick={() => navigate(1)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
        >
          <IconChevronRight size={20} />
        </ActionIcon>
      </Box>
    );
  }

  // Grid / Strip / List
  const gridClass = viewMode === 'strip' ? 'panel-grid' : viewMode === 'list' ? 'panel-list' : 'panel-grid';
  const minSize = viewMode === 'strip' ? 140 : 200;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={panels.map((p) => p.id)} strategy={rectSortingStrategy}>
        <Box
          className={gridClass}
          style={
            viewMode === 'list'
              ? { display: 'flex', flexDirection: 'column', gap: 12 }
              : {
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fill, minmax(${minSize}px, 1fr))`,
                  gap: viewMode === 'strip' ? 10 : 14,
                }
          }
        >
          {panels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              sceneId={sceneId}
              width={viewMode === 'list' ? 600 : minSize}
              showDetails={viewMode === 'list'}
              variant={viewMode === 'list' ? 'list' : 'grid'}
            />
          ))}

          {/* Add panel card */}
          <Box
            className="add-panel-card"
            onClick={() => openAddPanelModal(sceneId)}
            style={
              viewMode === 'list'
                ? { width: 600 }
                : {}
            }
          >
            <Box className="add-panel-icon">+</Box>
            <Box className="add-panel-label">패널 추가</Box>
          </Box>
        </Box>
      </SortableContext>
    </DndContext>
  );
}
