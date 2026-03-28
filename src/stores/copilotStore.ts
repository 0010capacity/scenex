// Copilot Store - manages conversation for the copilot sidebar
// Separate from AIChatStore which is scenario-specific

import { create } from 'zustand';
import type { CopilotMessage, SkillCall, SkillResult } from '@/ai/skills/types';

interface CopilotState {
  messages: CopilotMessage[];
  isLoading: boolean;
  lastSkillResults: SkillResult[];

  // Actions
  addUserMessage: (content: string) => string;
  addAssistantMessage: (content: string, skillCalls?: SkillCall[], skillResults?: SkillResult[]) => void;
  updateLastMessage: (updates: Partial<CopilotMessage>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setSkillResults: (results: SkillResult[]) => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  messages: [],
  isLoading: false,
  lastSkillResults: [],

  addUserMessage: (content) => {
    const id = crypto.randomUUID();
    const message: CopilotMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return id;
  },

  addAssistantMessage: (content, skillCalls, skillResults) => {
    const id = crypto.randomUUID();
    const message: CopilotMessage = {
      id,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      skillCalls,
      skillResults,
    };

    set((state) => ({
      messages: [...state.messages, message],
      lastSkillResults: skillResults || [],
    }));
  },

  updateLastMessage: (updates) => {
    set((state) => {
      if (state.messages.length === 0) return state;

      const lastIndex = state.messages.length - 1;
      const updatedMessages = [...state.messages];
      updatedMessages[lastIndex] = {
        ...updatedMessages[lastIndex],
        ...updates,
      };

      return { messages: updatedMessages };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [], lastSkillResults: [] }),

  setSkillResults: (results) => set({ lastSkillResults: results }),
}));
