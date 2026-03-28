# Scenario AI Chat Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a toggleable right sidebar in scenario mode that provides conversational AI assistance for editing scenarios. Changes are auto-applied with Git checkpoint integration for safe undo capability.

**Architecture:** React components + Zustand store for state management, Tauri Rust commands for Git checkpoint operations using the existing `git2` dependency. Chat history persists per-scenario via the store.

**Tech Stack:** React, Zustand, Tauri 2, git2 (already in dependencies), Mantine UI

---

## File Structure

```
src/
├── components/
│   └── scenario/
│       ├── AIChatSidebar.tsx      # Main sidebar container
│       ├── ChatMessageList.tsx    # Message list with bubbles
│       └── ChatInput.tsx          # Input field with send button
├── stores/
│   └── aiChatStore.ts             # Zustand store for chat state
src-tauri/src/
├── commands/
│   └── checkpoints.rs             # NEW: Git checkpoint commands
```

---

## Phase 1: State Management (Frontend)

### Task 1: Create aiChatStore

**Files:**
- Create: `src/stores/aiChatStore.ts`
- Test: `src/stores/aiChatStore.test.ts` (optional)

- [ ] **Step 1: Create the store file**

```typescript
// src/stores/aiChatStore.ts
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  checkpointId?: string;
}

interface AIChatState {
  messages: Record<string, ChatMessage[]>;  // scenarioId -> messages
  isLoading: boolean;
  activeScenarioId: string | null;

  // Actions
  getMessages: (scenarioId: string) => ChatMessage[];
  addUserMessage: (scenarioId: string, content: string) => string;
  addAssistantMessage: (scenarioId: string, content: string, checkpointId?: string) => void;
  markApplied: (scenarioId: string, messageId: string) => void;
  clearHistory: (scenarioId: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveScenarioId: (scenarioId: string | null) => void;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  messages: {},
  isLoading: false,
  activeScenarioId: null,

  getMessages: (scenarioId) => {
    return get().messages[scenarioId] || [];
  },

  addUserMessage: (scenarioId, content) => {
    const id = crypto.randomUUID();
    const message: ChatMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [scenarioId]: [...(state.messages[scenarioId] || []), message],
      },
    }));

    return id;
  },

  addAssistantMessage: (scenarioId, content, checkpointId) => {
    const id = crypto.randomUUID();
    const message: ChatMessage = {
      id,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      checkpointId,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [scenarioId]: [...(state.messages[scenarioId] || []), message],
      },
    }));
  },

  clearHistory: (scenarioId) => {
    set((state) => {
      const { [scenarioId]: _, ...rest } = state.messages;
      return { messages: rest };
    });
  },

  markApplied: (scenarioId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [scenarioId]: (state.messages[scenarioId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, checkpointId: undefined } : msg
        ),
      },
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setActiveScenarioId: (scenarioId) => set({ activeScenarioId: scenarioId }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/aiChatStore.ts
git commit -m "feat(ai-chat): add aiChatStore for scenario chat history"
```

---

## Phase 2: Core Components

### Task 2: Create ChatInput Component

**Files:**
- Create: `src/components/scenario/ChatInput.tsx`
- Modify: `src/components/scenario/AIChatSidebar.tsx` (later)

- [ ] **Step 1: Create ChatInput component**

```tsx
// src/components/scenario/ChatInput.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scenario/ChatInput.tsx
git commit -m "feat(ai-chat): add ChatInput component"
```

---

### Task 3: Create ChatMessageList Component

**Files:**
- Create: `src/components/scenario/ChatMessageList.tsx`

- [ ] **Step 1: Create ChatMessageList component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scenario/ChatMessageList.tsx
git commit -m "feat(ai-chat): add ChatMessageList component"
```

---

### Task 4: Create AIChatSidebar Component

**Files:**
- Create: `src/components/scenario/AIChatSidebar.tsx`

- [ ] **Step 1: Create AIChatSidebar component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scenario/AIChatSidebar.tsx
git commit -m "feat(ai-chat): add AIChatSidebar component"
```

---

## Phase 3: Git Checkpoint Commands (Rust)

### Task 5: Add Checkpoint Tauri Commands

**Files:**
- Create: `src-tauri/src/commands/checkpoints.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Create checkpoints.rs**

```rust
// src-tauri/src/commands/checkpoints.rs
use git2::{Repository, Signature, Oid};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckpointInfo {
    pub id: String,       // Commit SHA
    pub message: String,  // Commit message
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoredContent {
    pub content: String,
    pub checkpoint: CheckpointInfo,
}

/// Create a checkpoint (git commit) for a scenario before AI editing
#[command]
pub async fn create_scenario_checkpoint(
    project_path: String,
    scenario_id: String,
    content: String,
    message: String,
) -> Result<CheckpointInfo, String> {
    let project_path = PathBuf::from(&project_path);

    // Find the scenario file (project.scenex/scenarios/{id}.md or similar)
    // For now, we'll create a .scenex-ai-backup directory for checkpoints
    let backup_dir = project_path.join(".scenex-ai-backup").join(&scenario_id);
    std::fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Write the current content to backup
    let backup_file = backup_dir.join(format!("{}.md", chrono::Utc::now().timestamp_millis()));
    std::fs::write(&backup_file, &content)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    // Get repo (must be initialized at project root)
    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    // Add the backup file to git
    let mut index = repo.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;

    let relative_path = backup_file.strip_prefix(&project_path)
        .map_err(|e| format!("Failed to get relative path: {}", e))?;

    index.add_path(relative_path)
        .map_err(|e| format!("Failed to add file to index: {}", e))?;
    index.write()
        .map_err(|e| format!("Failed to write index: {}", e))?;

    // Create tree and commit
    let tree_id = index.write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id)
        .map_err(|e| format!("Failed to find tree: {}", e))?;

    let sig = Signature::now("SceneX AI", "ai@scenex.local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    let parent_commits: Vec<git2::Commit> = match repo.head() {
        Ok(head) => {
            let commit = head.peel_to_commit()
                .map_err(|e| format!("Failed to peel to commit: {}", e))?;
            vec![commit]
        }
        Err(_) => vec![],
    };

    let parent_refs: Vec<&git2::Commit> = parent_commits.iter().collect();

    let full_message = format!("ai-edit(scenario): {}", message);

    let commit_id = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &full_message,
        &tree,
        &parent_refs,
    ).map_err(|e| format!("Failed to create commit: {}", e))?;

    Ok(CheckpointInfo {
        id: commit_id.to_string(),
        message: full_message,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// Restore scenario content from a checkpoint
#[command]
pub async fn restore_scenario_checkpoint(
    project_path: String,
    checkpoint_id: String,
    scenario_id: String,
) -> Result<RestoredContent, String> {
    let project_path = PathBuf::from(&project_path);
    let backup_dir = project_path.join(".scenex-ai-backup").join(&scenario_id);

    // Find the backup file matching this checkpoint
    let commit_oid = Oid::from_str(&checkpoint_id)
        .map_err(|e| format!("Invalid checkpoint ID: {}", e))?;

    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let commit = repo.find_commit(commit_oid)
        .map_err(|e| format!("Failed to find commit: {}", e))?;

    let tree = commit.tree()
        .map_err(|e| format!("Failed to get tree: {}", e))?;

    // Find the backup file in the tree
    let backup_pattern = format!(".scenex-ai-backup/{}/", scenario_id);

    let mut content = String::new();
    let mut found_file = false;

    for entry in tree.iter() {
        if let Some(name) = entry.name() {
            if name.starts_with(&backup_pattern) && name.ends_with(".md") {
                let blob = repo.find_blob(entry.id())
                    .map_err(|e| format!("Failed to find blob: {}", e))?;
                content = String::from_utf8_lossy(blob.content()).to_string();
                found_file = true;
                break;
            }
        }
    }

    if !found_file {
        return Err("Backup file not found in checkpoint".to_string());
    }

    Ok(RestoredContent {
        content,
        checkpoint: CheckpointInfo {
            id: checkpoint_id,
            message: commit.summary().unwrap_or_default().to_string(),
            timestamp: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        },
    })
}

/// List checkpoint commits for a scenario
#[command]
pub async fn list_scenario_checkpoints(
    project_path: String,
    scenario_id: String,
    limit: u32,
) -> Result<Vec<CheckpointInfo>, String> {
    let project_path = PathBuf::from(&project_path);

    let repo = Repository::discover(&project_path)
        .map_err(|e| format!("Failed to find git repository: {}", e))?;

    let mut revwalk = repo.revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;

    revwalk.push_head()
        .map_err(|e| format!("Failed to push head: {}", e))?;

    let mut checkpoints = Vec::new();
    let backup_pattern = format!(".scenex-ai-backup/{}/", scenario_id);

    for (count, oid_result) in revwalk.enumerate() {
        if count >= limit as usize {
            break;
        }

        let oid = oid_result
            .map_err(|e| format!("Failed to get oid: {}", e))?;

        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        let message = commit.summary().unwrap_or_default().to_string();

        // Only include AI edit checkpoints for this scenario
        if message.starts_with("ai-edit(scenario):") {
            checkpoints.push(CheckpointInfo {
                id: oid.to_string(),
                message,
                timestamp: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default(),
            });
        }
    }

    Ok(checkpoints)
}
```

- [ ] **Step 2: Update commands/mod.rs**

Add to `src-tauri/src/commands/mod.rs`:
```rust
pub mod checkpoints;
```

- [ ] **Step 3: Update lib.rs**

Add to the invoke_handler in `src-tauri/src/lib.rs`:
```rust
commands::checkpoints::create_scenario_checkpoint,
commands::checkpoints::restore_scenario_checkpoint,
commands::checkpoints::list_scenario_checkpoints,
```

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/commands/checkpoints.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat(checkpoints): add Git checkpoint commands for scenario AI"
```

---

**Note:** The `Scenario` type extension with `chatHistory` is not needed since chat history is managed per-scenarioId in `aiChatStore` (in-memory). If persistence across sessions is required, the `aiChatStore` could be persisted via zustand middleware, but this is out of scope for initial implementation.

---

## Phase 4: Workspace Integration

### Task 6: Integrate AIChatSidebar into Workspace

**Files:**
- Modify: `src/components/layout/Workspace.tsx`
- Modify: `src/components/layout/Toolbar.tsx` (add AI chat toggle button)
- Modify: `src/stores/uiStore.ts` (add scenarioSidebarOpen state)

- [ ] **Step 1: Add scenarioSidebarOpen to uiStore**

In `src/stores/uiStore.ts`, add:
```typescript
scenarioSidebarOpen: boolean,
toggleScenarioSidebar: () => void,
```

- [ ] **Step 2: Update Workspace.tsx for scenario mode with ResizeHandle**

```tsx
// In Workspace.tsx - modify the scenario mode section
// Add AIChatSidebar alongside ScenarioEditor with resize support

// At the top with other imports:
import { AIChatSidebar } from '@/components/scenario/AIChatSidebar';
import { ResizeHandle } from './ResizeHandle';

// In the scenario mode section:
const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 480;

if (editorMode === 'scenario') {
  const [sidebarWidth, setSidebarWidth] = useState(320);

  const handleResize = (delta: number) => {
    setSidebarWidth((w) => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w + delta)));
  };

  return (
    <Box className="workspace">
      <Box className="canvas-area" style={{ flex: 1 }}>
        <ScenarioEditor />
      </Box>
      <ResizeHandle side="right" onResize={handleResize} />
      <AIChatSidebar
        opened={scenarioSidebarOpen}
        onClose={toggleScenarioSidebar}
        width={sidebarWidth}
      />
    </Box>
  );
}
```

- [ ] **Step 3: Add AI toggle button to Toolbar**

In `src/components/layout/Toolbar.tsx`, add an AI chat toggle button that only appears in scenario mode:

```tsx
// Add import for IconSparkles
import { IconSparkles } from '@tabler/icons-react';

// In the Toolbar component, conditionally render:
{editorMode === 'scenario' && (
  <ActionIcon
    size="md"
    variant={scenarioSidebarOpen ? 'filled' : 'subtle'}
    onClick={toggleScenarioSidebar}
    title="AI Chat"
  >
    <IconSparkles size={18} stroke={1.5} />
  </ActionIcon>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/uiStore.ts src/components/layout/Workspace.tsx src/components/layout/Toolbar.tsx
git commit -m "feat(ai-chat): integrate AIChatSidebar with toggle and resize"
```

---

## Phase 5: Wire Up AI Flow

### Task 7: Connect AIChatSidebar to Tauri + Claude

**Files:**
- Modify: `src/components/scenario/AIChatSidebar.tsx`
- Modify: `src/stores/uiStore.ts` (add workspacePath)

**Note:** The project is stored in `project` from `useProjectStore()`. The workspace path should be retrieved from `uiStore` (add `workspacePath: string | null` state if not already present).

- [ ] **Step 1: Update AIChatSidebar to use checkpoints and Claude**

```tsx
// Update AIChatSidebar.tsx - full handleSend with checkpoint + AI integration
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@/stores/projectStore';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useClaude } from '@/hooks/useClaude';

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
  const [workspacePath] = useState(() => {
    // TODO: Get from uiStore or workspace context
    // For now, assume project.path is available or use a placeholder
    return '/path/to/workspace'; // TODO: Replace with actual workspace path
  });

  const messages = selectedScenarioId ? getMessages(selectedScenarioId) : [];

  const handleSend = async (content: string) => {
    if (!selectedScenarioId || !project) return;

    const scenario = project.scenarios.find(s => s.id === selectedScenarioId);
    if (!scenario) return;

    addUserMessage(selectedScenarioId, content);
    setLoading(true);

    try {
      // 1. Create checkpoint before AI edit (best effort)
      let checkpointId: string | undefined;
      try {
        const checkpoint = await invoke<{ id: string }>('create_scenario_checkpoint', {
          projectPath: workspacePath,
          scenarioId: selectedScenarioId,
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
        updateScenario(selectedScenarioId, { content: result.suggestion });
        addAssistantMessage(selectedScenarioId, result.suggestion, checkpointId);
      } else {
        addAssistantMessage(
          selectedScenarioId,
          `오류: ${result.error || '알 수 없는 오류가 발생했습니다'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

- [ ] **Step 2: Add handleUndo for restoring checkpoints**

```tsx
// Add to AIChatSidebar component:
const handleUndo = async (checkpointId: string) => {
  if (!selectedScenarioId) return;

  try {
    const result = await invoke<{ content: string }>('restore_scenario_checkpoint', {
      projectPath: workspacePath,
      checkpointId,
      scenarioId: selectedScenarioId,
    });

    if (result.content) {
      updateScenario(selectedScenarioId, { content: result.content });
      addNotification('info', '변경사항을 되돌렸습니다');
    }
  } catch (e) {
    addNotification('error', `되돌리기 실패: ${e}`);
  }
};

// Pass handleUndo to ChatMessageList:
// <ChatMessageList messages={messages} isLoading={isLoading} onUndo={handleUndo} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/scenario/AIChatSidebar.tsx
git commit -m "feat(ai-chat): wire up AIChatSidebar to Tauri checkpoint commands"
```

---

## Summary

| Phase | Tasks | Files Created/Modified |
|-------|-------|------------------------|
| 1 | 1 | `src/stores/aiChatStore.ts` |
| 2 | 3 | `src/components/scenario/ChatInput.tsx`, `ChatMessageList.tsx`, `AIChatSidebar.tsx` |
| 3 | 1 | `src-tauri/src/commands/checkpoints.rs`, `mod.rs`, `lib.rs` |
| 4 | 1 | `src/stores/uiStore.ts`, `src/components/layout/Workspace.tsx`, `src/components/layout/Toolbar.tsx` |
| 5 | 1 | `src/components/scenario/AIChatSidebar.tsx` (update) |

**Total: 7 tasks across 5 phases**
