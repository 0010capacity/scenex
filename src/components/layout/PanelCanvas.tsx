import { Box, Text, Center } from '@mantine/core';
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
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { SceneGroup } from '@/components/panels/SceneGroup';

export function PanelCanvas() {
  const project = useProjectStore(s => s.project);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const viewMode = useUIStore(s => s.viewMode);
  const reorderPanels = useProjectStore(s => s.reorderPanels);
  const movePanel = useProjectStore(s => s.movePanel);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromSceneId = active.data.current?.sceneId as string | undefined;
    const toSceneId = over.data.current?.sceneId as string | undefined;

    if (!fromSceneId || !toSceneId) return;

    // Cross-scene move
    if (fromSceneId !== toSceneId) {
      movePanel(active.id as string, toSceneId);
      return;
    }

    // Same-scene reorder
    const scene = project?.scenario.scenes.find(s => s.id === fromSceneId);
    if (!scene) return;

    const oldIndex = scene.panels.findIndex(p => p.id === active.id);
    const newIndex = scene.panels.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderPanels(fromSceneId, oldIndex, newIndex);
    }
  };

  if (!project) {
    return (
      <Center style={{ height: '100%' }}>
        <Text c="dimmed">로딩 중...</Text>
      </Center>
    );
  }

  const scenesToShow = project.scenario.scenes;

  if (scenesToShow.length === 0) {
    return (
      <Center style={{ height: '100%' }}>
        <Box className="canvas-empty">
          <Box className="empty-icon">+</Box>
          <Text className="empty-title">프로젝트가 비어있습니다</Text>
          <Text className="empty-sub">시나리오를 입력하거나 AI로 자동 생성하세요</Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box
      className="canvas-inner"
      style={{
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top left',
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {scenesToShow.map((scene) => (
          <SceneGroup
            key={scene.id}
            scene={scene}
            viewMode={viewMode}
          />
        ))}
      </DndContext>
    </Box>
  );
}
