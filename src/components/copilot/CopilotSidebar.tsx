// CopilotSidebar - AI Copilot sidebar for storyboard and scenario modes
// Integrated copilot with Skills Framework

import { Box, Text, ActionIcon, Loader } from '@mantine/core';
import { IconX, IconSparkles, IconCheck, IconAlertCircle, IconMessageCircle } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import { ChatInput } from '@/components/scenario/ChatInput';
import { useCopilotStore } from '@/stores/copilotStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useCopilot } from '@/hooks/useCopilot';
import type { CopilotMessage, SkillResult } from '@/ai/skills/types';

interface CopilotSidebarProps {
  opened: boolean;
  onClose: () => void;
  width: number;
}

export function CopilotSidebar({ opened, onClose, width }: CopilotSidebarProps) {
  const project = useProjectStore(s => s.project);
  const editorMode = useUIStore(s => s.editorMode);
  const { messages, isLoading, lastSkillResults } = useCopilotStore();
  const { sendMessage } = useCopilot();

  const handleSend = async (content: string) => {
    if (!project) return;
    await sendMessage(content);
  };

  if (!opened) return null;

  return (
    <Box
      style={{
        width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg1)',
        borderLeft: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <Box
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSparkles size={14} color="var(--accent)" stroke={1.5} />
        </Box>
        <Text size="sm" fw={600} style={{ flex: 1, color: 'var(--text)' }}>
          AI Copilot
        </Text>
        <ActionIcon size="sm" variant="subtle" onClick={onClose}>
          <IconX size={14} stroke={1.5} />
        </ActionIcon>
      </Box>

      {/* Messages */}
      <CopilotMessageList messages={messages} isLoading={isLoading} skillResults={lastSkillResults} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!project}
        placeholder={editorMode === 'storyboard'
          ? "패널을 수정하거나 SVG를 생성해주세요..."
          : "시나리오를 수정해주세요..."}
      />
    </Box>
  );
}

/**
 * Message list for copilot - shows skill calls and results
 */
function CopilotMessageList({
  messages,
  isLoading,
  skillResults,
}: {
  messages: CopilotMessage[];
  isLoading: boolean;
  skillResults: SkillResult[];
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 10,
        }}
      >
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--bg2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <IconMessageCircle size={20} color="var(--text3)" stroke={1.5} />
        </Box>
        <Text size="sm" c="dimmed" ta="center" fw={500} style={{ color: 'var(--text2)' }}>
          AI Copilot에게 요청하세요
        </Text>
        <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: 180, lineHeight: 1.5 }}>
          패널을 추가, 수정하거나 시나리오를 편집할 수 있습니다
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Show skill results if any during loading */}
      {isLoading && skillResults.length > 0 && (
        <SkillResultsDisplay results={skillResults} />
      )}

      {isLoading && messages.length > 0 && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            alignSelf: 'flex-start',
          }}
        >
          <Loader size="xs" />
          <Text size="xs" c="dimmed">AI가 응답 중...</Text>
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
}

/**
 * Single message bubble
 */
function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === 'user';

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'var(--accent)' : 'var(--bg2)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: isUser ? 'white' : 'var(--text)',
        }}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Text>
      </Box>

      {/* Show skill calls badges */}
      {message.skillCalls && message.skillCalls.length > 0 && (
        <Box style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {message.skillCalls.map((call, i) => (
            <Box
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
              }}
            >
              <IconSparkles size={10} color="var(--accent)" stroke={2} />
              <Text
                size="xs"
                fw={500}
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10,
                }}
              >
                {call.skill}.{call.tool}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Show skill results if this is an assistant message */}
      {message.role === 'assistant' && message.skillResults && message.skillResults.length > 0 && (
        <SkillResultsDisplay results={message.skillResults} />
      )}
    </Box>
  );
}

/**
 * Display skill execution results
 */
function SkillResultsDisplay({ results }: { results: SkillResult[] }) {
  const allSuccess = results.every(r => r.success);
  const someSuccess = results.some(r => r.success);

  return (
    <Box
      style={{
        marginTop: 8,
        padding: '10px 12px',
        borderRadius: 10,
        width: '100%',
        background: allSuccess
          ? 'color-mix(in srgb, var(--success) 8%, transparent)'
          : someSuccess
            ? 'color-mix(in srgb, var(--warning) 8%, transparent)'
            : 'color-mix(in srgb, var(--error) 8%, transparent)',
        border: `1px solid ${allSuccess
          ? 'color-mix(in srgb, var(--success) 20%, transparent)'
          : someSuccess
            ? 'color-mix(in srgb, var(--warning) 20%, transparent)'
            : 'color-mix(in srgb, var(--error) 20%, transparent)'}`,
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {allSuccess ? (
          <IconCheck size={14} color="var(--success)" stroke={2.5} />
        ) : someSuccess ? (
          <IconAlertCircle size={14} color="var(--warning)" stroke={2.5} />
        ) : (
          <IconAlertCircle size={14} color="var(--error)" stroke={2.5} />
        )}
        <Text
          size="xs"
          fw={600}
          style={{
            color: allSuccess ? 'var(--success)' : someSuccess ? 'var(--warning)' : 'var(--error)',
          }}
        >
          {allSuccess ? '완료' : someSuccess ? '일부 완료' : '실패'}
        </Text>
      </Box>

      {results.map((result, i) => (
        <Box
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: i < results.length - 1 ? 6 : 0,
          }}
        >
          <Box
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: result.success ? 'var(--success)' : 'var(--error)',
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <Text
            size="xs"
            style={{
              flex: 1,
              color: 'var(--text)',
              opacity: result.success ? 0.85 : 1,
            }}
          >
            {result.message || (result.success ? '완료' : result.error)}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
