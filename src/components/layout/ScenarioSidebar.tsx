import { Box, Text, ActionIcon, Loader } from '@mantine/core';
import { IconPlus, IconX, IconSparkles, IconFileText } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';
import { ScriptLine } from '@/types';

export function ScenarioSidebar() {
  const { project, selectedSceneId, selectScene, addScene, updateScene } = useProjectStore();
  const { toggleLeftSidebar } = useUIStore();
  const { generateScriptLines } = useClaude();
  const [aiInput, setAiInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const renderScriptLine = (line: ScriptLine) => {
    switch (line.type) {
      case 'slugline':
        return (
          <Box key={line.id} className="script-slug">
            {line.text}
          </Box>
        );
      case 'action':
        return (
          <Box key={line.id} className="script-action" style={{ padding: '0 4px' }}>
            {line.text}
          </Box>
        );
      case 'character':
        return (
          <Box key={line.id} className="script-char">
            {line.text}
          </Box>
        );
      case 'paren':
        return (
          <Box key={line.id} className="script-paren">
            ({line.text})
          </Box>
        );
      case 'dialogue':
        return (
          <Box key={line.id} className="script-dialog">
            "{line.text}"
          </Box>
        );
      default:
        return null;
    }
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
          <Box
            key={scene.id}
            onClick={() => selectScene(scene.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--r4)',
              fontSize: 10,
              fontFamily: 'var(--mono)',
              fontWeight: 500,
              cursor: 'pointer',
              background:
                scene.id === selectedSceneId ? 'var(--bg3)' : 'transparent',
              color:
                scene.id === selectedSceneId ? 'var(--accent)' : 'var(--text3)',
              border: '1px solid',
              borderColor:
                scene.id === selectedSceneId ? 'var(--border2)' : 'transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            S{i + 1}
          </Box>
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

      {/* Script content */}
      <Box style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {selectedScene?.scriptLines && selectedScene.scriptLines.length > 0 ? (
          selectedScene.scriptLines.map(renderScriptLine)
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
