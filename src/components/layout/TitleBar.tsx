import { Box, Group, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useClaude } from '@/hooks/useClaude';

type EditorMode = 'scenario' | 'storyboard';

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
  const editorMode = useUIStore(s => s.editorMode);
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const { checkAvailability } = useClaude();
  const [claudeDropdownOpen, setClaudeDropdownOpen] = useState(false);
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const [claudeInfo, setClaudeInfo] = useState<{ version: string | null; path: string | null }>({ version: null, path: null });
  const [isChecking, setIsChecking] = useState(false);
  const claudeDropdownRef = useRef<HTMLDivElement>(null);
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);

  // Project & scenario state
  const project = useProjectStore(s => s.project);
  const selectedScenarioId = useProjectStore(s => s.selectedScenarioId);
  const selectScenario = useProjectStore(s => s.selectScenario);

  const selectedScenario = project?.scenarios.find(s => s.id === selectedScenarioId);

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
      if (scenarioDropdownRef.current && !scenarioDropdownRef.current.contains(e.target as Node)) {
        setScenarioDropdownOpen(false);
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
      style={{ WebkitAppRegion: 'drag', display: 'flex', alignItems: 'center' } as React.CSSProperties}
    >
      {/* Left section: Traffic lights + Scenario selector */}
      <Box style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
        {/* Traffic lights */}
        <Group gap={5}>
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

        {/* Scenario Selector */}
        {project && project.scenarios.length > 0 && (
          <Box
            ref={scenarioDropdownRef}
            style={{ position: 'relative', marginLeft: 80 }}
          >
          <Box
            style={{
              cursor: 'pointer',
              background: 'var(--bg1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onClick={() => setScenarioDropdownOpen((o) => !o)}
          >
            <Text size="xs" fw={500} style={{ color: 'var(--text2)' }}>
              {selectedScenario?.name || '시나리오 선택'}
            </Text>
            <IconChevronDown size={10} stroke={2} style={{ color: 'var(--text3)' }} />
          </Box>

          {/* Scenario Dropdown Panel */}
          {scenarioDropdownOpen && (
            <Box
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 6,
                width: 240,
                zIndex: 9999,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                maxHeight: 300,
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {project.scenarios.map((scenario, index) => (
                <Box key={scenario.id}>
                  {index > 0 && (
                    <Box style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  )}
                  <Box
                    onClick={() => {
                      selectScenario(scenario.id);
                      setScenarioDropdownOpen(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: scenario.id === selectedScenarioId ? 'var(--accent-dim)' : 'transparent',
                      color: scenario.id === selectedScenarioId ? 'var(--accent)' : 'var(--text)',
                      transition: 'background 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text size="sm" fw={scenario.id === selectedScenarioId ? 600 : 400}>
                      {scenario.name}
                    </Text>
                    {scenario.id === selectedScenarioId && (
                      <Box
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      </Box>

      {/* Mode Segment Control - center */}
      <Box
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          WebkitAppRegion: 'no-drag',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg2)',
          borderRadius: 6,
          padding: '3px 4px',
          gap: 2,
        }}
      >
        {(['scenario', 'storyboard'] as EditorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setEditorMode(mode)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: editorMode === mode ? 'var(--bg0)' : 'transparent',
              color: editorMode === mode ? 'var(--text)' : 'var(--text3)',
              boxShadow: editorMode === mode ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {mode === 'scenario' ? '시나리오' : '스토리보드'}
          </button>
        ))}
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
