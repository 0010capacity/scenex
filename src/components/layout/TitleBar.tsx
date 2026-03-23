import { Box, Group, Popover, Text } from '@mantine/core';
import { IconFileText, IconUpload, IconSparkles, IconFile, IconPhoto, IconBrandApple, IconVideo } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useClaude } from '@/hooks/useClaude';
import { useExport } from '@/hooks/useExport';

export function TitleBar() {
  const { toggleLeftSidebar, claudeStatus } = useUIStore();
  const { project, isDirty } = useProjectStore();
  const { checkAvailability } = useClaude();
  const { exportPDF, exportImages, exportFCPXML, exportPremiereXML } = useExport();
  const [exportPopoverOpened, setExportPopoverOpened] = useState(false);
  const [claudeInfo, setClaudeInfo] = useState<{ version: string | null }>({ version: null });

  useEffect(() => {
    checkAvailability().then((status) => {
      setClaudeInfo({ version: status.version });
    });
  }, [checkAvailability]);

  const statusColor =
    claudeStatus === 'available' ? '#22c55e' :
    claudeStatus === 'unavailable' ? '#ef4444' : '#f59e0b';

  const statusLabel =
    claudeStatus === 'available' ? 'Connected' :
    claudeStatus === 'unavailable' ? 'Unavailable' : 'Checking...';

  const handleExport = async (type: 'pdf' | 'images' | 'fcp' | 'premiere') => {
    setExportPopoverOpened(false);
    try {
      switch (type) {
        case 'pdf':
          await exportPDF();
          break;
        case 'images':
          await exportImages();
          break;
        case 'fcp':
          await exportFCPXML();
          break;
        case 'premiere':
          await exportPremiereXML();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

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
        <Popover
          opened={exportPopoverOpened}
          onChange={setExportPopoverOpened}
          position="bottom-end"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Box
              className="ai-status"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (claudeStatus === 'available') {
                  alert(`Claude Code 연결 상태: 정상${claudeInfo.version ? `\n버전: ${claudeInfo.version}` : ''}`);
                } else {
                  alert(`Claude Code 연결 상태: ${statusLabel}`);
                }
              }}
            >
              <Box
                className="ai-dot"
                style={{ backgroundColor: statusColor }}
              />
              <span className="ai-label">Claude Code</span>
            </Box>
          </Popover.Target>
        </Popover>

        <Box className="tb-divider" />

        <button className="tb-btn" onClick={toggleLeftSidebar}>
          <IconFileText size={14} stroke={1.5} />
          시나리오
        </button>

        <Popover
          opened={exportPopoverOpened}
          onChange={setExportPopoverOpened}
          position="bottom-end"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <button className="tb-btn" onClick={() => setExportPopoverOpened((o) => !o)}>
              <IconUpload size={14} stroke={1.5} />
              내보내기
            </button>
          </Popover.Target>
          <Popover.Dropdown style={{ padding: 4, minWidth: 180 }}>
            <Box
              onClick={() => handleExport('pdf')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <IconFile size={16} stroke={1.5} />
              <Box>
                <Text size="xs" fw={500}>PDF 스토리보드</Text>
                <Text size="xs" c="dimmed">인쇄용 문서</Text>
              </Box>
            </Box>
            <Box
              onClick={() => handleExport('images')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <IconPhoto size={16} stroke={1.5} />
              <Box>
                <Text size="xs" fw={500}>이미지 ZIP</Text>
                <Text size="xs" c="dimmed">이미지 패키지</Text>
              </Box>
            </Box>
            <Box
              onClick={() => handleExport('fcp')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <IconBrandApple size={16} stroke={1.5} />
              <Box>
                <Text size="xs" fw={500}>Final Cut XML</Text>
                <Text size="xs" c="dimmed">.fcpxml 파일</Text>
              </Box>
            </Box>
            <Box
              onClick={() => handleExport('premiere')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <IconVideo size={16} stroke={1.5} />
              <Box>
                <Text size="xs" fw={500}>Premiere XML</Text>
                <Text size="xs" c="dimmed">Adobe Premiere용</Text>
              </Box>
            </Box>
          </Popover.Dropdown>
        </Popover>

        <button className="tb-btn accent" onClick={() => useUIStore.getState().openAiGenModal()}>
          <IconSparkles size={14} stroke={1.5} />
          AI 생성
        </button>
      </Box>
    </Box>
  );
}
