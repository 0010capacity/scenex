import { Box, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = '메시지를 입력하세요...' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim() && !disabled;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg1)',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          color: 'var(--text)',
          fontFamily: 'var(--sans)',
          padding: 0,
        }}
      />
      <ActionIcon
        size="md"
        variant="subtle"
        onClick={handleSend}
        disabled={!canSend}
        style={{
          color: canSend ? 'var(--accent)' : 'var(--text3)',
        }}
      >
        <IconSend size={16} stroke={1.5} />
      </ActionIcon>
    </Box>
  );
}
