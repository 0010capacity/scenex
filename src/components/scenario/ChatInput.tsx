import { Box, TextInput, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = '시나리오 수정 요청...' }: ChatInputProps) {
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

  return (
    <Box
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg1)',
      }}
    >
      <TextInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{ flex: 1 }}
        styles={{
          input: {
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            '&:focus': {
              borderColor: 'var(--accent)',
            },
          },
        }}
      />
      <ActionIcon
        size="lg"
        variant="filled"
        color="blue"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          background: value.trim() && !disabled ? 'var(--accent)' : undefined,
        }}
      >
        <IconSend size={16} stroke={1.5} />
      </ActionIcon>
    </Box>
  );
}
