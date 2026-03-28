import { Box } from '@mantine/core';
import { useUIStore } from '@/stores/uiStore';

export function TabBar() {
  const editorMode = useUIStore(s => s.editorMode);
  const setEditorMode = useUIStore(s => s.setEditorMode);

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        backgroundColor: 'var(--bg1)',
        borderBottom: '1px solid var(--border)',
        gap: 8,
      }}
    >
      <button
        onClick={() => setEditorMode('scenario')}
        style={{
          padding: '6px 20px',
          fontSize: 13,
          fontWeight: 500,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          backgroundColor: editorMode === 'scenario' ? 'var(--bg2)' : 'transparent',
          color: editorMode === 'scenario' ? 'var(--text)' : 'var(--text3)',
          boxShadow: editorMode === 'scenario' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        시나리오
      </button>
      <button
        onClick={() => setEditorMode('storyboard')}
        style={{
          padding: '6px 20px',
          fontSize: 13,
          fontWeight: 500,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          backgroundColor: editorMode === 'storyboard' ? 'var(--bg2)' : 'transparent',
          color: editorMode === 'storyboard' ? 'var(--text)' : 'var(--text3)',
          boxShadow: editorMode === 'storyboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        스토리보드
      </button>
    </Box>
  );
}
