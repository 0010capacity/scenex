import { Box, Text, Progress } from '@mantine/core';
import { IconSparkles, IconCheck, IconX } from '@tabler/icons-react';
import { useAIStore } from '@/stores/aiStore';

export function AITaskStatus() {
  const { tasks, isProcessing } = useAIStore();

  const activeTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'running'
  );
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;
  const totalCount = tasks.length;

  if (totalCount === 0) return null;

  const currentTask = activeTasks[0];
  const showProgress = isProcessing && currentTask;

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 300,
        maxWidth: 500,
      }}
    >
      {/* Status summary */}
      <Box
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r8)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <IconSparkles size={16} stroke={1.5} color="var(--accent)" />
        <Text style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
          {showProgress && currentTask
            ? currentTask.message
            : completedCount > 0
            ? `${completedCount} task${completedCount > 1 ? 's' : ''} completed`
            : failedCount > 0
            ? `${failedCount} task${failedCount > 1 ? 's' : ''} failed`
            : 'AI 작업 대기중'}
        </Text>
        {completedCount > 0 && (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconCheck size={14} stroke={2} color="var(--green)" />
            <Text style={{ fontSize: 11, color: 'var(--green)' }}>{completedCount}</Text>
          </Box>
        )}
        {failedCount > 0 && (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconX size={14} stroke={2} color="var(--red)" />
            <Text style={{ fontSize: 11, color: 'var(--red)' }}>{failedCount}</Text>
          </Box>
        )}
      </Box>

      {/* Progress bar */}
      {showProgress && currentTask && (
        <Box
          style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r6)',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Progress
            value={currentTask.progress}
            size="sm"
            color="indigo"
            animated
            style={{ background: 'var(--bg3)', borderRadius: 'var(--r4)' }}
          />
          <Text
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {currentTask.progress}%
          </Text>
        </Box>
      )}
    </Box>
  );
}