import { Box } from '@mantine/core';
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
import { Panel } from '@/types';
import { PanelCard } from './PanelCard';
import { useProjectStore } from '@/stores/projectStore';

interface PanelGridProps {
  panels: Panel[];
  sceneId: string;
  zoomLevel: number;
  viewMode: 'grid' | 'list';
}

export function PanelGrid({ panels, sceneId, zoomLevel, viewMode }: PanelGridProps) {
  const { reorderPanels } = useProjectStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  // Calculate panel size based on zoom
  const baseWidth = 280;
  const panelWidth = baseWidth * (zoomLevel / 100);

  if (panels.length === 0) {
    return (
      <Box
        style={{
          padding: '48px',
          textAlign: 'center',
          color: '#4E4C48',
          backgroundColor: '#13141A',
          borderRadius: 8,
          border: '1px dashed #2A2826',
        }}
      >
        No panels yet. Click "Add Panel" to create your first panel.
      </Box>
    );
  }

  if (viewMode === 'list') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={panels.map((p) => p.id)} strategy={rectSortingStrategy}>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {panels.map((panel) => (
              <Box key={panel.id} style={{ width: '100%' }}>
                <PanelCard
                  panel={panel}
                  sceneId={sceneId}
                  width={600}
                  showDetails
                />
              </Box>
            ))}
          </Box>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={panels.map((p) => p.id)} strategy={rectSortingStrategy}>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${panelWidth}px, 1fr))`,
            gap: 16,
          }}
        >
          {panels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              sceneId={sceneId}
              width={panelWidth}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}
