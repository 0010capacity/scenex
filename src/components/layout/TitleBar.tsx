import { Box, Group, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useClaude } from '@/hooks/useClaude';

// Window API type definitions
interface WindowApi {
  close?: () => void;
  minimize?: () => void;
  maximize?: () => void;
}

declare global {
  interface Window {
    api?: WindowApi;
  }
}

// Type-safe window API wrapper
const windowApi = {
  close: () => {
    if (typeof window !== 'undefined' && window.api?.close) {
      try {
        window.api.close();
      } catch (e) {
        console.warn('[WindowAPI] close failed:', e);
      }
    }
  },
  minimize: () => {
    if (typeof window !== 'undefined' && window.api?.minimize) {
      try {
        window.api.minimize();
      } catch (e) {
        console.warn('[WindowAPI] minimize failed:', e);
      }
    }
  },
  maximize: () => {
    if (typeof window !== 'undefined' && window.api?.maximize) {
      try {
        window.api.maximize();
      } catch (e) {
        console.warn('[WindowAPI] maximize failed:', e);
      }
    }
  },
};

const MODEL_OPTIONS = [
  { value: 'haiku', label: 'Haiku' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'opus', label: 'Opus' },
];

export function TitleBar() {
  const claudeStatus = useUIStore(s => s.claudeStatus);
  const claudeModel = useUIStore(s => s.claudeModel);
  const setClaudeModel = useUIStore(s => s.setClaudeModel);
  const openProjectBrowser = useUIStore(s => s.openProjectBrowser);
  const isDirty = useProjectStore(s => s.isDirty);
  const { currentProjectName } = useWorkspace();
  const { checkAvailability } = useClaude();
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
    claudeStatus === 'available' ? 'var(--green)' :
    claudeStatus === 'unavailable' ? 'var(--red)' : 'var(--text3)';

  return (
    <Box
      className="titlebar"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Traffic lights */}
      <Group gap={5} style={{ WebkitAppRegion: 'no-drag', alignSelf: 'flex-start', paddingTop: 12 }}>
        <Box
          component="span"
          className="t-close"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => windowApi.close()}
          role="button"
          aria-label="창 닫기"
        />
        <Box
          component="span"
          className="t-min"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => windowApi.minimize()}
          role="button"
          aria-label="창 최소화"
        />
        <Box
          component="span"
          className="t-max"
          style={{ width: 11, height: 11, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => windowApi.maximize()}
          role="button"
          aria-label="창 최대화"
        />
      </Group>

      {/* App wordmark / Project breadcrumb */}
      <Box
        className="app-wordmark"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={openProjectBrowser}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <Text
            style={{
              fontSize: 13,
              color: 'var(--text)',
              fontWeight: 500,
            }}
          >
            {currentProjectName ? (
              <>
                {currentProjectName}
                {isDirty && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>•</span>}
              </>
            ) : (
              <span style={{ color: 'var(--text3)' }}>Select project</span>
            )}
          </Text>
          <IconChevronDown size={10} stroke={2} style={{ color: 'var(--text3)' }} />
        </button>
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
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
            onClick={() => setClaudeDropdownOpen((o) => !o)}
          >
            <Box
              className="ai-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="ai-label" style={{ color: 'var(--text2)' }}>Claude Code</span>
            <IconChevronDown size={10} stroke={2} style={{ color: 'var(--text3)', marginLeft: 2 }} />
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
                borderRadius: 10,
                padding: 12,
                width: 260,
                zIndex: 9999,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Row */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text size="sm" fw={600} style={{ color: 'var(--text)' }}>Claude Code</Text>
                <Text size="xs" style={{ color: statusColor, fontWeight: 500 }}>
                  ● {claudeStatus === 'available' ? '연결됨' : claudeStatus === 'unavailable' ? '연결 실패' : '확인 중...'}
                </Text>
              </Box>

              {/* Action Row - Model Select or Install */}
              {claudeStatus === 'available' ? (
                <Box>
                  <label htmlFor="claude-model" style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>모델</label>
                  <select
                    id="claude-model"
                    value={claudeModel}
                    onChange={(e) => setClaudeModel(e.target.value as 'haiku' | 'sonnet' | 'opus')}
                    style={{
                      width: '100%',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: 12,
                      cursor: 'pointer',
                      marginBottom: 10,
                      outline: 'none',
                    }}
                  >
                    {MODEL_OPTIONS.map((model) => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </Box>
              ) : claudeStatus === 'unavailable' ? (
                <Box
                  component="a"
                  href="https://docs.anthropic.com/en/docs/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    background: 'var(--accent)',
                    borderRadius: 6,
                    color: 'var(--text-inverse)',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                    marginBottom: 10,
                  }}
                >
                  설치하기
                </Box>
              ) : null}

              {/* Meta Row */}
              {claudeStatus === 'available' && (
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size="xs" style={{ color: 'var(--text3)' }}>
                    {claudeInfo.version || 'v1.0'}
                  </Text>
                  <Box
                    component="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRefreshStatus();
                    }}
                    aria-label="상태 새로고침"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      fontSize: 11,
                      cursor: isChecking ? 'wait' : 'pointer',
                      padding: 0,
                    }}
                  >
                    ↻
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
