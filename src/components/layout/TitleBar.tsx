import { Box, Group } from '@mantine/core';
import { IconFileText, IconUpload, IconSparkles } from '@tabler/icons-react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

export function TitleBar() {
  const { toggleLeftSidebar, openAiGenModal } = useUIStore();
  const { project, isDirty } = useProjectStore();

  return (
    <Box
      className="titlebar"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Traffic lights */}
      <Group gap={5} style={{ WebkitAppRegion: 'no-drag' }}>
        <Box
          component="span"
          className="t-close"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => (window as any).api?.close?.()}
        />
        <Box
          component="span"
          className="t-min"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => (window as any).api?.minimize?.()}
        />
        <Box
          component="span"
          className="t-max"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => (window as any).api?.maximize?.()}
        />
      </Group>

      {/* App wordmark */}
      <Box
        className="app-wordmark"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        Scene<b>Forge</b>
        {project && (
          <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 8 }}>
            — {project.name}{isDirty ? ' •' : ''}
          </span>
        )}
      </Box>

      {/* Right controls */}
      <Box className="tb-right" style={{ marginLeft: 'auto', WebkitAppRegion: 'no-drag' }}>
        <Box
          className="ai-status"
          onClick={() => alert('Claude Code 연결 상태: 정상\n모델: claude-opus-4\n버전: v1.0.3')}
        >
          <Box className="ai-dot" />
          <span className="ai-label">Claude Code</span>
        </Box>

        <Box className="tb-divider" />

        <button className="tb-btn" onClick={toggleLeftSidebar}>
          <IconFileText size={14} stroke={1.5} />
          시나리오
        </button>

        <button className="tb-btn" onClick={() => alert('내보내기\n· PDF 스토리보드\n· 이미지 패키지 (ZIP)\n· 파이널 컷 XML\n· 프리미어 XML')}>
          <IconUpload size={14} stroke={1.5} />
          내보내기
        </button>

        <button className="tb-btn accent" onClick={openAiGenModal}>
          <IconSparkles size={14} stroke={1.5} />
          AI 생성
        </button>
      </Box>
    </Box>
  );
}
