import { Box, Group, Popover, Text, Select, Button, Stack, Divider } from '@mantine/core';
import { IconFileText, IconUpload, IconSparkles, IconFile, IconPhoto, IconBrandApple, IconVideo, IconRefresh, IconExternalLink, IconCheck, IconX, IconChevronDown } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useClaude } from '@/hooks/useClaude';
import { useExport } from '@/hooks/useExport';

const MODEL_OPTIONS = [
  { value: 'haiku', label: 'Claude Haiku', description: '빠르고 효율적인 모델' },
  { value: 'sonnet', label: 'Claude Sonnet', description: '균형 잡힌 성능' },
  { value: 'opus', label: 'Claude Opus', description: '가장 강력한 모델' },
];

export function TitleBar() {
  const { toggleLeftSidebar, claudeStatus, claudeModel, setClaudeModel } = useUIStore();
  const { project, isDirty } = useProjectStore();
  const { checkAvailability } = useClaude();
  const { exportPDF, exportImages, exportFCPXML, exportPremiereXML } = useExport();
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [claudeDropdownOpen, setClaudeDropdownOpen] = useState(false);
  const [claudeInfo, setClaudeInfo] = useState<{ version: string | null; path: string | null }>({ version: null, path: null });
  const [isChecking, setIsChecking] = useState(false);
  const claudeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAvailability().then((status) => {
      setClaudeInfo({ version: status.version, path: status.path });
    });
  }, [checkAvailability]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (claudeDropdownRef.current && !claudeDropdownRef.current.contains(e.target as Node)) {
        setClaudeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefreshStatus = async () => {
    setIsChecking(true);
    const status = await checkAvailability();
    setClaudeInfo({ version: status.version, path: status.path });
    setIsChecking(false);
  };

  const statusColor =
    claudeStatus === 'available' ? '#22c55e' :
    claudeStatus === 'unavailable' ? '#ef4444' : '#f59e0b';

  const statusLabel =
    claudeStatus === 'available' ? '연결됨' :
    claudeStatus === 'unavailable' ? '연결 실패' : '확인 중...';

  const handleExport = async (type: 'pdf' | 'images' | 'fcp' | 'premiere') => {
    setExportDropdownOpen(false);
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

        {/* Claude Status Dropdown Wrapper */}
        <Box
          ref={claudeDropdownRef}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <Box
            className="ai-status"
            style={{
              cursor: 'pointer',
              background: claudeStatus === 'available'
                ? 'rgba(78, 203, 165, 0.12)'
                : claudeStatus === 'unavailable'
                  ? 'rgba(224, 82, 82, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
              borderColor: claudeStatus === 'available'
                ? 'rgba(78, 203, 165, 0.2)'
                : claudeStatus === 'unavailable'
                  ? 'rgba(224, 82, 82, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
            }}
            onClick={() => setClaudeDropdownOpen((o) => !o)}
          >
            <Box
              className="ai-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="ai-label" style={{ color: statusColor }}>Claude Code</span>
            <IconChevronDown size={10} stroke={2} style={{ color: statusColor, marginLeft: 2 }} />
          </Box>

          {/* Claude Dropdown Panel */}
          {claudeDropdownOpen && (
            <Box
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 12,
                minWidth: 220,
                zIndex: 9999,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack gap={10}>
                {/* Connection Status */}
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={600} c="dimmed">Claude Code 연결</Text>
                  <Box
                    component="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRefreshStatus();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isChecking ? 'wait' : 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      opacity: isChecking ? 0.5 : 1,
                    }}
                  >
                    <IconRefresh
                      size={14}
                      stroke={1.5}
                      style={{
                        animation: isChecking ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                  </Box>
                </Group>

                <Group gap={8} align="center">
                  {claudeStatus === 'checking' || isChecking ? (
                    <>
                      <Box style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <Text size="sm">확인 중...</Text>
                    </>
                  ) : claudeStatus === 'available' ? (
                    <>
                      <IconCheck size={16} stroke={1.5} color="#22c55e" />
                      <Box>
                        <Text size="sm" fw={500}>{statusLabel}</Text>
                        {claudeInfo.version && (
                          <Text size="xs" c="dimmed">{claudeInfo.version}</Text>
                        )}
                      </Box>
                    </>
                  ) : (
                    <>
                      <IconX size={16} stroke={1.5} color="#ef4444" />
                      <Box>
                        <Text size="sm" fw={500}>연결 실패</Text>
                        <Text size="xs" c="dimmed">Claude Code를 찾을 수 없음</Text>
                      </Box>
                    </>
                  )}
                </Group>

                {/* Model Selection - only show if connected */}
                {claudeStatus === 'available' && (
                  <>
                    <Divider my={4} />
                    <Box>
                      <Text size="xs" fw={600} c="dimmed" mb={6}>모델 선택</Text>
                      <Select
                        value={claudeModel}
                        onChange={(value) => setClaudeModel(value as 'haiku' | 'sonnet' | 'opus')}
                        data={MODEL_OPTIONS.map(opt => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        size="xs"
                        styles={{
                          input: {
                            fontSize: 12,
                          },
                        }}
                      />
                      <Text size="xs" c="dimmed" mt={4}>
                        {MODEL_OPTIONS.find(opt => opt.value === claudeModel)?.description}
                      </Text>
                    </Box>
                  </>
                )}

                {/* Install Link - only show if unavailable */}
                {claudeStatus === 'unavailable' && (
                  <>
                    <Divider my={4} />
                    <Button
                      component="a"
                      href="https://docs.anthropic.com/en/docs/claude-code"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      variant="light"
                      fullWidth
                      rightSection={<IconExternalLink size={12} />}
                    >
                      Claude Code 설치하기
                    </Button>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Box>

        <Box className="tb-divider" />

        <button className="tb-btn" onClick={toggleLeftSidebar}>
          <IconFileText size={14} stroke={1.5} />
          시나리오
        </button>

        <Popover
          opened={exportDropdownOpen}
          onChange={setExportDropdownOpen}
          position="bottom-end"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <button className="tb-btn" onClick={() => setExportDropdownOpen((o) => !o)}>
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
