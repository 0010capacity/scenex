# Scenario AI Chat Sidebar Design

**Date:** 2026-03-28
**Status:** Draft
**Author:** Claude

## Overview

A toggleable right sidebar in scenario mode that provides conversational AI assistance for editing scenarios. Changes are auto-applied with Git checkpoint integration for safe undo capability.

## Requirements

### Functional Requirements
1. **Conversational AI Interface**: Free-form chat like ChatGPT
2. **Auto-apply Changes**: AI responses automatically update scenario content
3. **Git Checkpoints**: Automatic commits before AI edits for safe rollback
4. **Chat History Persistence**: Store conversation history per scenario
5. **Toggle Sidebar**: Show/hide sidebar in scenario mode

### Non-Functional Requirements
- Response time: < 3s for AI responses
- Git operations: < 500ms for checkpoint creation
- Chat history: Persist across sessions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Workspace (scenario mode)                │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│      ScenarioEditor             │    AIChatSidebar          │
│      (CodeMirror 6)             │    (toggleable)           │
│                                 │                           │
│                                 │    ┌─────────────────┐    │
│                                 │    │ Chat Messages   │    │
│                                 │    │ (user + AI)     │    │
│                                 │    ├─────────────────┤    │
│                                 │    │ Input Field     │    │
│                                 │    └─────────────────┘    │
│                                 │                           │
├─────────────────────────────────┴───────────────────────────┤
│                      ResizeHandle                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. AIChatSidebar

New component at `src/components/scenario/AIChatSidebar.tsx`

**Props:**
```typescript
interface AIChatSidebarProps {
  opened: boolean;
  onClose: () => void;
  scenarioId: string;
  width: number;
  onResize: (delta: number) => void;
}
```

**Features:**
- Header with close button
- Message list with auto-scroll
- Input field with send button
- Loading state indicator

### 2. ChatMessageList

Component at `src/components/scenario/ChatMessageList.tsx`

**Props:**
```typescript
interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onUndo: (checkpointId: string) => void;
}
```

### 3. ChatInput

Component at `src/components/scenario/ChatInput.tsx`

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}
```

## State Management

### aiChatStore

New store at `src/stores/aiChatStore.ts`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  applied?: boolean;
  checkpointId?: string;
}

interface AIChatState {
  messages: Record<string, ChatMessage[]>;  // scenarioId -> messages
  isLoading: boolean;

  // Actions
  getMessages: (scenarioId: string) => ChatMessage[];
  addUserMessage: (scenarioId: string, content: string) => string;
  addAssistantMessage: (scenarioId: string, content: string, checkpointId?: string) => void;
  markApplied: (scenarioId: string, messageId: string) => void;
  clearHistory: (scenarioId: string) => void;
  setLoading: (loading: boolean) => void;
}
```

### Scenario Type Extension

Extend `src/types/scenario.ts`:

```typescript
interface Scenario {
  // ... existing fields
  chatHistory?: ChatMessage[];
}
```

## Data Flow

1. **User sends message:**
   - `addUserMessage()` adds to chat history
   - `setLoading(true)`
   - `create_scenario_checkpoint()` called via Tauri

2. **AI processes request:**
   - Use existing `useClaude` hook's `generateDescriptionSuggestion()` extended for scenario editing
   - AI response received

3. **Apply changes:**
   - `updateScenario()` with new content
   - `addAssistantMessage()` with checkpoint ID
   - `setLoading(false)`

4. **User undoes:**
   - `restore_scenario_checkpoint()` called
   - Scenario content restored
   - Message marked as reverted

## Git Integration

### Tauri Commands

Add to `src-tauri/src/lib.rs`:

```rust
use git2::{Repository, Signature, Oid};

#[derive(Serialize)]
struct CheckpointInfo {
    id: String,           // Commit SHA
    message: String,      // Commit message
    timestamp: String,    // ISO 8601
}

#[derive(Serialize)]
struct RestoredContent {
    content: String,
    checkpoint: CheckpointInfo,
}

#[tauri::command]
async fn create_scenario_checkpoint(
    project_path: String,
    scenario_id: String,
    message: String,
) -> Result<CheckpointInfo, String> {
    // 1. Open repository
    // 2. Stage scenario file
    // 3. Create commit with message
    // 4. Return checkpoint info
}

#[tauri::command]
async fn restore_scenario_checkpoint(
    project_path: String,
    checkpoint_id: String,
) -> Result<RestoredContent, String> {
    // 1. Open repository
    // 2. Checkout specific commit for scenario file
    // 3. Return restored content
}

#[tauri::command]
async fn list_scenario_checkpoints(
    project_path: String,
    scenario_id: String,
    limit: u32,
) -> Result<Vec<CheckpointInfo>, String> {
    // 1. Open repository
    // 2. Get commit history for scenario file
    // 3. Return list of checkpoints
}
```

### Commit Message Format

```
ai-edit(scenario): before "user request summary..."
```

Example:
```
ai-edit(scenario): before "Add dialogue to Scene 1"
```

## UI Design

### Sidebar Layout

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ 🤖 AI Assistant      [X]    │ │  ← Header
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ User: Add dialogue to S1    │ │  ← User message (right-aligned)
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ AI: Added dialogue...       │ │  ← AI message (left-aligned)
│ │ [↩ Undo]                    │ │  ← Undo button
│ └─────────────────────────────┘ │
│                                 │
│         ... scroll ...          │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────┬───────┐ │
│ │ Type a message...   │ Send  │ │  ← Input area
│ └─────────────────────┴───────┘ │
└─────────────────────────────────┘
```

### Styling

Follow existing theme patterns from `src/styles/theme.ts`:
- Background: `var(--bg1)`
- User message: `var(--bg3)` with right alignment
- AI message: `var(--bg2)` with left alignment
- Accent: `var(--accent)` for buttons and highlights

## Implementation Steps

1. **Phase 1: Core Components**
   - Create `AIChatSidebar` component
   - Create `ChatMessageList` component
   - Create `ChatInput` component

2. **Phase 2: State Management**
   - Create `aiChatStore`
   - Extend `Scenario` type
   - Integrate with `projectStore`

3. **Phase 3: Git Integration**
   - Add `git2` dependency to Cargo.toml
   - Implement Tauri commands
   - Connect to frontend

4. **Phase 4: Workspace Integration**
   - Modify `Workspace.tsx` for scenario mode
   - Add toggle button to Toolbar
   - Add resize functionality

5. **Phase 5: Polish**
   - Add loading states
   - Add error handling
   - Add keyboard shortcuts

## Testing Considerations

- Unit tests for `aiChatStore`
- Integration tests for Git commands
- E2E tests for chat flow
- Edge cases: network failures, Git conflicts

## Security Considerations

- Git operations should be scoped to project directory
- No arbitrary command execution
- Validate checkpoint IDs before restore

## Open Questions

None at this time. Design is ready for implementation.
