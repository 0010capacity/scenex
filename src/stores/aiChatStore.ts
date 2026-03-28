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
