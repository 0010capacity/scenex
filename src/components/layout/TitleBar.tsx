import { Box, Group, Popover, Text, Stack } from '@mantine/core';
import { IconFileText, IconUpload, IconSparkles, IconFile, IconPhoto, IconBrandApple, IconVideo, IconRefresh, IconExternalLink, IconChevronDown } from '@tabler/icons-react';
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
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
                width: 280,
                zIndex: 9999,
                boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <Group justify="space-between" align="center" mb={14}>
                <Group gap={8}>
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #ffff00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>C</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={600}>Claude Code</Text>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'var(--mono)' }}>
                      {claudeStatus === 'available' ? (claudeInfo.version || '연결됨') : claudeStatus === 'checking' ? '확인 중...' : '미설치'}
                    </Text>
                  </Box>
                </Group>
                <Box
                  component="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleRefreshStatus();
                  }}
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    cursor: isChecking ? 'wait' : 'pointer',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--text2)',
                    fontSize: 11,
                    transition: 'all 0.15s',
                  }}
                >
                  <IconRefresh
                    size={12}
                    stroke={2}
                    style={{
                      animation: isChecking ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  {isChecking ? '확인 중' : '새로고침'}
                </Box>
              </Group>

              {/* Status Indicator */}
              <Box
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: claudeStatus === 'available'
                    ? 'rgba(34, 197, 94, 0.08)'
                    : claudeStatus === 'unavailable'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${
                    claudeStatus === 'available'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : claudeStatus === 'unavailable'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)'
                  }`,
                  marginBottom: 14,
                }}
              >
                <Group gap={8} align="center">
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: claudeStatus === 'available' ? '#22c55e' : claudeStatus === 'unavailable' ? '#ef4444' : '#f59e0b',
                      boxShadow: `0 0 8px ${claudeStatus === 'available' ? '#22c55e' : claudeStatus === 'unavailable' ? '#ef4444' : '#f59e0b'}`,
                    }}
                  />
                  <Text size="xs" fw={500}>
                    {claudeStatus === 'available' ? '연결됨 — AI 기능 사용 가능' : claudeStatus === 'unavailable' ? '연결 실패 — 설치를 확인하세요' : '연결 확인 중...'}
                  </Text>
                </Group>
              </Box>

              {/* Model Selection - only show if connected */}
              {claudeStatus === 'available' && (
                <Box>
                  <Text size="xs" fw={600} c="dimmed" mb={8} style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>모델 선택</Text>
                  <Stack gap={6}>
                    {MODEL_OPTIONS.map((model) => (
                      <Box
                        key={model.value}
                        component="button"
                        onClick={() => setClaudeModel(model.value as 'haiku' | 'sonnet' | 'opus')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: claudeModel === model.value ? 'var(--gold)' : 'var(--border)',
                          background: claudeModel === model.value ? 'var(--gold-dim)' : 'var(--bg2)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <Box
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: claudeModel === model.value ? 'var(--gold)' : 'var(--border2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {claudeModel === model.value && (
                            <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                          )}
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>{model.label}</Text>
                          <Text size="xs" c="dimmed">{model.description}</Text>
                        </Box>
                        {claudeModel === model.value && (
                          <Text size="xs" style={{ color: 'var(--gold)', fontWeight: 600 }}>사용 중</Text>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Install Link - only show if unavailable */}
              {claudeStatus === 'unavailable' && (
                <Box>
                  <Box
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      marginBottom: 10,
                      textAlign: 'center',
                    }}
                  >
                    <Text size="xs" c="dimmed" mb={6}>
                      Claude Code가 시스템에서 감지되지 않았습니다.
                    </Text>
                    <Text size="xs" c="dimmed">
                      설치하면 AI 기반 스토리보드 생성 기능을 사용할 수 있습니다.
                    </Text>
                  </Box>
                  <Box
                    component="a"
                    href="https://docs.anthropic.com/en/docs/claude-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--gold-dim)',
                      border: '1px solid rgba(232, 168, 56, 0.3)',
                      color: 'var(--gold)',
                      fontSize: 12,
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    Claude Code 설치하기
                    <IconExternalLink size={12} stroke={2} />
                  </Box>
                </Box>
              )}
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
