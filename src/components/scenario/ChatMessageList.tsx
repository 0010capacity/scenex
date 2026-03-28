// src/components/scenario/ChatMessageList.tsx
import { Box, Text, ActionIcon, Loader } from '@mantine/core';
import { IconArrowBackUp } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/stores/aiChatStore';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onUndo?: (checkpointId: string) => void;
}

export function ChatMessageList({ messages, isLoading, onUndo }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text size="sm" c="dimmed" ta="center">
          AI에게 시나리오 수션을 요청해보세요
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
        <Box
          key={msg.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <Box
            style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--bg3)' : 'var(--bg2)',
              border: '1px solid var(--border)',
            }}
          >
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </Text>
          </Box>

          {msg.role === 'assistant' && msg.checkpointId && onUndo && (
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={() => onUndo(msg.checkpointId!)}
              style={{ marginTop: 4, color: 'var(--text3)' }}
              title="변경 되돌리기"
            >
              <IconArrowBackUp size={14} stroke={1.5} />
            </ActionIcon>
          )}
        </Box>
      ))}

      {isLoading && (
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
