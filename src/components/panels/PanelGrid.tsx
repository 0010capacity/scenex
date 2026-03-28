import { Box, ActionIcon, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import {
  SortableContext,
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
  const addPanel = useProjectStore(s => s.addPanel);
  const openAiGenModal = useUIStore(s => s.openAiGenModal);
  const [slideIndex, setSlideIndex] = useState(0);

  // Empty state
  if (panels.length === 0) {
    return (
      <Box className="panel-empty">
        <Text className="panel-empty-text">
          이 장면에는 아직 패널이 없어요.
        </Text>
        <Box className="panel-empty-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => addPanel(sceneId)}
          >
            + 패널 추가
          </button>
          <button
            className="btn btn-accent btn-sm"
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
          variant="subtle"
          onClick={() => navigate(-1)}
          style={{ color: 'var(--text2)' }}
        >
          <IconChevronLeft size={20} />
        </ActionIcon>

        <Box style={{ width: 400, maxWidth: '100%' }}>
          <PanelCard panel={currentPanel} sceneId={sceneId} width={400} />
        </Box>

        <ActionIcon
          size="xl"
          variant="subtle"
          onClick={() => navigate(1)}
          style={{ color: 'var(--text2)' }}
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
            variant={viewMode === 'list' ? 'list' : 'grid'}
          />
        ))}

        {/* Add panel card */}
        <Box
          className="add-panel-card"
          onClick={() => addPanel(sceneId)}
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
  );
}
