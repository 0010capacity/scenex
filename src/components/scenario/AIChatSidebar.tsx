// src/components/scenario/AIChatSidebar.tsx
import { Box, Text, ActionIcon } from '@mantine/core';
import { IconX, IconSparkles } from '@tabler/icons-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useProjectStore } from '@/stores/projectStore';
import { useClaude } from '@/hooks/useClaude';

interface AIChatSidebarProps {
  opened: boolean;
  onClose: () => void;
  width: number;
}

export function AIChatSidebar({ opened, onClose, width }: AIChatSidebarProps) {
  const { project, selectedScenarioId, updateScenario } = useProjectStore();
  const { generateDescriptionSuggestion } = useClaude();
  const {
    getMessages,
    addUserMessage,
    addAssistantMessage,
    isLoading,
    setLoading,
  } = useAIChatStore();

  const messages = selectedScenarioId ? getMessages(selectedScenarioId) : [];

  const handleSend = async (content: string) => {
    if (!selectedScenarioId || !project) return;

    const scenario = project.scenarios.find(s => s.id === selectedScenarioId);
    if (!scenario) return;

    // Add user message
    addUserMessage(selectedScenarioId, content);
    setLoading(true);

    try {
      // TODO: Integrate with Tauri checkpoint + AI
      // For now, simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addAssistantMessage(selectedScenarioId, `Echo: ${content}`);
    } finally {
      setLoading(false);
    }
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
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <IconSparkles size={18} color="var(--accent)" stroke={1.5} />
        <Text size="sm" fw={500} style={{ flex: 1 }}>
          AI Assistant
        </Text>
        <ActionIcon size="sm" variant="subtle" onClick={onClose}>
          <IconX size={16} stroke={1.5} />
        </ActionIcon>
      </Box>

      {/* Messages */}
      <ChatMessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={!selectedScenarioId} />
    </Box>
  );
}
