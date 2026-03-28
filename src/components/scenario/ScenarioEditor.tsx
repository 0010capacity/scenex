import { Box, Text } from '@mantine/core';
import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { codeFolding } from '@codemirror/language';
import { useProjectStore } from '@/stores/projectStore';
import { createScenarioBadgeExtension, BadgeClickInfo } from './scenarioDecorators';
import { BadgeEditModal } from './BadgeEditModal';

export function ScenarioEditor() {
  const project = useProjectStore(s => s.project);
  const addScenario = useProjectStore(s => s.addScenario);
  const updateScenario = useProjectStore(s => s.updateScenario);
  const selectedScenarioId = useProjectStore(s => s.selectedScenarioId);
  const selectScenario = useProjectStore(s => s.selectScenario);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [badgeModalOpened, setBadgeModalOpened] = useState(false);
  const [badgeInfo, setBadgeInfo] = useState<BadgeClickInfo | null>(null);

  const scenarios = project?.scenarios || [];
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Handle badge click
  const handleBadgeClick = useCallback((info: BadgeClickInfo) => {
    setBadgeInfo(info);
    setBadgeModalOpened(true);
  }, []);

  // Handle badge edit save
  const handleBadgeSave = useCallback(
    (info: BadgeClickInfo, newContent: string) => {
      if (!viewRef.current || !selectedScenarioId) return;

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
    [selectedScenarioId]
  );

  // Auto-create scenario if none exists - runs when scenarios array is empty
  useEffect(() => {
    if (project && scenarios.length === 0) {
      // Auto-create a default scenario with template content
      const name = project.name || '시나리오';
      const id = addScenario(name);
      selectScenario(id);
    }
  }, [project, scenarios.length, addScenario, selectScenario]);

  // Auto-select first scenario if none selected
  useEffect(() => {
    if (!selectedScenarioId && scenarios.length > 0) {
      selectScenario(scenarios[0].id);
    }
  }, [selectedScenarioId, scenarios, selectScenario]);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && selectedScenarioId) {
        const content = update.state.doc.toString();
        updateScenario(selectedScenarioId, { content });
      }
    });

    // Create badge extension with click callback
    const badgeExtension = createScenarioBadgeExtension(handleBadgeClick);

    const state = EditorState.create({
      doc: selectedScenario?.content || '',
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage }),
        keymap.of([indentWithTab]),
        codeFolding(),
        updateListener,
        // Badge decorators for markdown headings with click handler
        badgeExtension,
        // Theme
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          },
          '.cm-content': {
            padding: '16px',
          },
          '.cm-line': {
            padding: '0 4px',
          },
          '.cm-gutters': {
            background: 'var(--bg1)',
            borderRight: '1px solid var(--border)',
          },
          '.cm-foldGutter': {
            padding: '0 4px',
          },
          '.cm-foldPlaceholder': {
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            color: 'var(--text2)',
            padding: '0 4px',
            borderRadius: '3px',
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
  }, [selectedScenarioId]); // Re-create when scenario changes

  // Update content when scenario changes externally
  useEffect(() => {
    if (viewRef.current && selectedScenario) {
      const currentContent = viewRef.current.state.doc.toString();
      const newContent = selectedScenario.content || '';
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
  }, [selectedScenario?.content]);

  if (!project) {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Text c="dimmed">프로젝트를 먼저 선택하세요</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        background: 'var(--bg1)',
      }}
    >
      {/* Editor - always show, auto-creates scenario if needed */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Box
          ref={editorRef}
          style={{
            height: '100%',
            overflow: 'hidden',
            padding: '12px',
          }}
        />
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
