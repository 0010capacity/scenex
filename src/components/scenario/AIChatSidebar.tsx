// src/components/scenario/AIChatSidebar.tsx
import { Box, Text, ActionIcon } from '@mantine/core';
import { IconX, IconSparkles } from '@tabler/icons-react';
import { invoke } from '@tauri-apps/api/core';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useProjectStore } from '@/stores/projectStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';

interface AIChatSidebarProps {
  opened: boolean;
  onClose: () => void;
  width: number;
}

export function AIChatSidebar({ opened, onClose, width }: AIChatSidebarProps) {
  const { project, updateScenario } = useProjectStore();
  const { currentProjectPath: workspacePath } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { generateDescriptionSuggestion } = useClaude();
  const {
    getMessages,
    addUserMessage,
    addAssistantMessage,
    isLoading,
    setLoading,
  } = useAIChatStore();

  const scenario = project?.scenario;
  const messages = scenario ? getMessages(scenario.id) : [];

  const handleSend = async (content: string) => {
    if (!scenario || !project) return;

    addUserMessage(scenario.id, content);
    setLoading(true);

    try {
      // 1. Create checkpoint before AI edit (best effort)
      let checkpointId: string | undefined;
      try {
        const checkpoint = await invoke<{ id: string }>('create_scenario_checkpoint', {
          projectPath: workspacePath,
          scenarioId: scenario.id,
          content: scenario.content,
          message: content.slice(0, 50),
        });
        checkpointId = checkpoint.id;
      } catch (e) {
        console.warn('Failed to create checkpoint:', e);
      }

      // 2. Call Claude for scenario editing
      const result = await generateDescriptionSuggestion(
        `Current scenario content:\n${scenario.content}\n\nUser request: ${content}\n\nReturn the modified scenario content in markdown format.`
      );

      if (result.success && result.suggestion) {
        // 3. Update scenario with AI response
        updateScenario({ content: result.suggestion });
        addAssistantMessage(scenario.id, result.suggestion, checkpointId);
      } else {
        addAssistantMessage(
          scenario.id,
          `오류: ${result.error || '알 수 없는 오류가 발생했습니다'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (checkpointId: string) => {
    if (!scenario) return;

    try {
      const result = await invoke<{ content: string }>('restore_scenario_checkpoint', {
        projectPath: workspacePath,
        checkpointId,
        scenarioId: scenario.id,
      });

      if (result.content) {
        updateScenario({ content: result.content });
        addNotification('info', '변경사항을 되돌렸습니다');
      }
    } catch (e) {
      addNotification('error', `되돌리기 실패: ${e}`);
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
      <ChatMessageList messages={messages} isLoading={isLoading} onUndo={handleUndo} />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={!scenario?.id} />
    </Box>
  );
}
