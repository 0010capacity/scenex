import { Box, Text, ActionIcon, Loader } from '@mantine/core';
import { IconPlus, IconX, IconSparkles, IconFileText, IconPencil, IconTrash, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { useState } from 'react';
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
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';
import { ScriptLine } from '@/types';

interface SortableSceneTabProps {
  sceneId: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableSceneTab({ sceneId, index, isSelected, onSelect }: SortableSceneTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sceneId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Box
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 'var(--r4)',
        fontSize: 10,
        fontFamily: 'var(--mono)',
        fontWeight: 500,
        cursor: 'grab',
        background: isSelected ? 'var(--bg3)' : 'transparent',
        color: isSelected ? 'var(--accent)' : 'var(--text3)',
        border: '1px solid',
        borderColor: isSelected ? 'var(--border2)' : 'transparent',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      S{index + 1}
    </Box>
  );
}

export function ScenarioSidebar() {
  const { project, selectedSceneId, selectScene, addScene, updateScene, updateScriptLine, deleteScriptLine, reorderScriptLines, reorderScenes } = useProjectStore();
  const { toggleLeftSidebar } = useUIStore();
  const { generateScriptLines } = useClaude();
  const [aiInput, setAiInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSceneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = project?.scenes.findIndex((s) => s.id === active.id) ?? -1;
      const newIndex = project?.scenes.findIndex((s) => s.id === over.id) ?? -1;
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderScenes(oldIndex, newIndex);
      }
    }
  };

  if (!project) return null;

  const selectedScene = project.scenes.find((s) => s.id === selectedSceneId);

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !selectedSceneId || isLoading) return;

    setIsLoading(true);
    try {
      const result = await generateScriptLines(aiInput);
      if (result.success && result.script_lines.length > 0) {
        // Convert DTO to ScriptLine format and add to scene
        const newLines: ScriptLine[] = result.script_lines.map((line) => ({
          id: crypto.randomUUID(),
          type: line.line_type as ScriptLine['type'],
          text: line.text,
          character: line.character ?? undefined,
        }));

        const currentLines = selectedScene?.scriptLines || [];
        updateScene(selectedSceneId, {
          scriptLines: [...currentLines, ...newLines],
        });
      }
    } finally {
      setIsLoading(false);
      setAiInput('');
    }
  };

  const handleStartEdit = (line: ScriptLine) => {
    setEditingLineId(line.id);
    setEditingText(line.text);
  };

  const handleSaveEdit = () => {
    if (editingLineId && selectedSceneId && editingText.trim()) {
      updateScriptLine(selectedSceneId, editingLineId, { text: editingText.trim() });
    }
    setEditingLineId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingLineId(null);
    setEditingText('');
  };

  const handleDeleteLine = (lineId: string) => {
    if (selectedSceneId) {
      deleteScriptLine(selectedSceneId, lineId);
    }
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    if (!selectedScene) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedScene.scriptLines.length) return;
    reorderScriptLines(selectedSceneId!, index, newIndex);
  };

  const renderScriptLine = (line: ScriptLine, index: number) => {
    const isEditing = editingLineId === line.id;
    const isHovered = hoveredLineId === line.id;
    const lineIndex = selectedScene?.scriptLines.findIndex(l => l.id === line.id) ?? index;

    const lineStyle = {
      position: 'relative' as const,
      padding: '2px 28px 2px 4px',
      borderRadius: 4,
      cursor: 'default',
      transition: 'background 0.1s',
    };

    const buttonStyle = {
      position: 'absolute' as const,
      right: 4,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      gap: 2,
      opacity: isHovered || isEditing ? 1 : 0,
      transition: 'opacity 0.1s',
    };

    if (isEditing) {
      return (
        <Box key={line.id} style={lineStyle}>
          <input
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
            onBlur={handleSaveEdit}
            autoFocus
            style={{
              width: '100%',
              background: 'var(--bg2)',
              border: '1px solid var(--accent)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: 'var(--text)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </Box>
      );
    }

    const content = (() => {
      switch (line.type) {
        case 'slugline':
          return <Box className="script-slug">{line.text}</Box>;
        case 'action':
          return <Box className="script-action">{line.text}</Box>;
        case 'character':
          return <Box className="script-char">{line.text}</Box>;
        case 'paren':
          return <Box className="script-paren">({line.text})</Box>;
        case 'dialogue':
          return <Box className="script-dialog">"{line.text}"</Box>;
        default:
          return null;
      }
    })();

    return (
      <Box
        key={line.id}
        style={lineStyle}
        onMouseEnter={() => setHoveredLineId(line.id)}
        onMouseLeave={() => setHoveredLineId(null)}
        onDoubleClick={() => handleStartEdit(line)}
      >
        {content}
        <Box style={buttonStyle}>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => handleMoveLine(lineIndex, 'up')}
            style={{ color: 'var(--text3)' }}
            disabled={lineIndex === 0}
          >
            <IconArrowUp size={10} />
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => handleMoveLine(lineIndex, 'down')}
            style={{ color: 'var(--text3)' }}
            disabled={selectedScene && lineIndex === selectedScene.scriptLines.length - 1}
          >
            <IconArrowDown size={10} />
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => handleStartEdit(line)}
            style={{ color: 'var(--text3)' }}
          >
            <IconPencil size={10} />
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => handleDeleteLine(line.id)}
            style={{ color: 'var(--accent)' }}
          >
            <IconTrash size={10} />
          </ActionIcon>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg1)',
      }}
    >
      {/* Sidebar header */}
      <Box
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
          }}
        >
          시나리오
        </Text>
        <button
          onClick={toggleLeftSidebar}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
            cursor: 'pointer',
            fontSize: 13,
            padding: '2px 4px',
            borderRadius: 3,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
        >
          <IconX size={14} stroke={1.5} />
        </button>
      </Box>

      {/* Scene tabs */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
        <SortableContext items={project.scenes.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          <Box
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 4,
              flexShrink: 0,
              overflowX: 'auto',
            }}
          >
            {project.scenes.map((scene, i) => (
              <SortableSceneTab
                key={scene.id}
                sceneId={scene.id}
                index={i}
                isSelected={scene.id === selectedSceneId}
                onSelect={() => selectScene(scene.id)}
              />
            ))}
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={() => addScene()}
          style={{ color: 'var(--text3)', flexShrink: 0 }}
        >
          <IconPlus size={14} />
        </ActionIcon>
          </Box>
        </SortableContext>
      </DndContext>

      {/* Script content */}
      <Box style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {selectedScene?.scriptLines && selectedScene.scriptLines.length > 0 ? (
          selectedScene.scriptLines.map((line, index) => renderScriptLine(line, index))
        ) : selectedScene ? (
          <Box style={{ padding: '16px 14px' }}>
            <Text style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
              {selectedScene.slugline || 'INT. LOCATION — DAY'}
            </Text>
            <Text style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6 }}>
              시나리오 내용이 없습니다. 아래에서 AI를 통해 생성하거나 직접 입력하세요.
            </Text>
          </Box>
        ) : (
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
              padding: 24,
            }}
          >
            <IconFileText size={24} color="var(--text3)" stroke={1.5} />
            <Text style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
              장면을 선택하세요
            </Text>
          </Box>
        )}
      </Box>

      {/* AI Input Bar */}
      <Box className="sidebar-ai-bar">
        <input
          className="sidebar-ai-input"
          placeholder="시나리오 수정 요청..."
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && aiInput.trim() && !isLoading) {
              handleAiSubmit();
            }
          }}
          disabled={isLoading}
        />
        <button
          className="sidebar-ai-send"
          onClick={handleAiSubmit}
          disabled={!aiInput.trim() || isLoading}
          style={{ opacity: isLoading || !aiInput.trim() ? 0.5 : 1 }}
        >
          {isLoading ? (
            <Loader size={14} color="var(--accent)" />
          ) : (
            <IconSparkles size={14} stroke={1.5} />
          )}
        </button>
      </Box>
    </Box>
  );
}
