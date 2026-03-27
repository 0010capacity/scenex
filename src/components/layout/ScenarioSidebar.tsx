import { Box, Text, ActionIcon, Loader } from '@mantine/core';
import { IconPlus, IconX, IconSparkles, IconFileText } from '@tabler/icons-react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
import { EditorView, basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { useProjectStore } from '@/stores/projectStore';
import { createScenarioBadgeExtension, BadgeClickInfo } from '@/components/scenario/scenarioDecorators';
import { BadgeEditModal } from '@/components/scenario/BadgeEditModal';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';

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
  const { project, selectedSceneId, selectScene, addScene, updateScene, reorderScenes } = useProjectStore();
  const { toggleLeftSidebar, addNotification } = useUIStore();
  const { generateDescriptionSuggestion } = useClaude();
  const [aiInput, setAiInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [badgeModalOpened, setBadgeModalOpened] = useState(false);
  const [badgeInfo, setBadgeInfo] = useState<BadgeClickInfo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedScene = project?.scenes.find((s) => s.id === selectedSceneId);

  // Handle badge click
  const handleBadgeClick = useCallback((info: BadgeClickInfo) => {
    setBadgeInfo(info);
    setBadgeModalOpened(true);
  }, []);

  // Handle badge edit save
  const handleBadgeSave = useCallback(
    (info: BadgeClickInfo, newContent: string) => {
      if (!viewRef.current || !selectedSceneId) return;

      // Reconstruct the full line with prefix
      let fullLine: string;
      if (info.badgeType === 'NOTE') {
        fullLine = `> ${newContent}`;
      } else if (info.badgeType === 'TITLE') {
        fullLine = `# ${newContent}`;
      } else if (info.badgeType === 'ACT') {
        fullLine = `## ${newContent}`;
      } else if (info.badgeType === 'SLUG' || info.badgeType === 'SCENE') {
        fullLine = `### ${newContent}`;
      } else {
        fullLine = newContent;
      }

      // Update the document
      viewRef.current.dispatch({
        changes: {
          from: info.lineFrom,
          to: info.lineTo,
          insert: fullLine,
        },
      });
    },
    [selectedSceneId]
  );

  // Initialize CM6 editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && selectedSceneId) {
        const content = update.state.doc.toString();
        updateScene(selectedSceneId, { description: content });
      }
    });

    // Create badge extension with click callback
    const badgeExtension = createScenarioBadgeExtension(handleBadgeClick);

    const state = EditorState.create({
      doc: selectedScene?.description || '',
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage }),
        keymap.of([indentWithTab]),
        updateListener,
        badgeExtension,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            background: 'transparent',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          },
          '.cm-content': {
            padding: '12px',
          },
          '.cm-line': {
            padding: '0 2px',
          },
          '.cm-gutters': {
            display: 'none',
          },
          '.cm-focused': {
            outline: 'none',
          },
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [selectedSceneId]); // Re-create when scene changes

  // Update content when scene changes externally
  useEffect(() => {
    if (viewRef.current && selectedScene) {
      const currentContent = viewRef.current.state.doc.toString();
      const newContent = selectedScene.description || '';
      if (currentContent !== newContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: newContent,
          },
        });
      }
    }
  }, [selectedScene?.description]);

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

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !selectedSceneId || isLoading || !selectedScene) return;

    setIsLoading(true);
    try {
      const currentDesc = selectedScene.description || '';
      const prompt = `${currentDesc}\n\nUser request: ${aiInput}`;
      const result = await generateDescriptionSuggestion(prompt);
      if (result.success && result.suggestion) {
        updateScene(selectedSceneId, { description: result.suggestion });
        addNotification('info', '시나리오가 업데이트되었습니다');
        setAiInput('');
      } else if (result.error) {
        addNotification('error', `실패: ${result.error}`);
      }
    } catch (error) {
      addNotification('error', `실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

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
              <IconPlus size={14} stroke={1.5} />
            </ActionIcon>
          </Box>
        </SortableContext>
      </DndContext>

      {/* CM6 Markdown Editor */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        {selectedScene ? (
          <Box
            ref={editorRef}
            style={{
              height: '100%',
              overflow: 'hidden',
            }}
          />
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

      {/* Badge Edit Modal */}
      <BadgeEditModal
        opened={badgeModalOpened}
        onClose={() => setBadgeModalOpened(false)}
        badgeInfo={badgeInfo}
        onSave={handleBadgeSave}
      />
    </Box>
  );
}
