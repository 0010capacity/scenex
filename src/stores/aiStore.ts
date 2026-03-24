import { create } from 'zustand';
import type { AITaskType, AITaskVersion } from '@/types/ai';

export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AITask {
  id: string;
  type: AITaskType;
  status: AITaskStatus;
  progress: number;
  message: string;
  parentTaskId?: string;
  previousVersionId?: string;
  promptVersion?: string;
  metadata?: {
    scenarioId?: string;
    actId?: string;
    sceneId?: string;
    panelId?: string;
    version?: number;
  };
}

interface AIState {
  tasks: AITask[];
  isProcessing: boolean;
  taskHistory: Map<string, AITaskVersion[]>;

  addTask: (task: Omit<AITask, 'id'>) => string;
  updateTask: (id: string, updates: Partial<AITask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
  addVersion: (taskId: string, version: AITaskVersion) => void;
  getVersions: (taskId: string) => AITaskVersion[];
  clearTaskHistory: (taskId: string) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  tasks: [],
  isProcessing: false,
  taskHistory: new Map(),

  addTask: (task) => {
    const id = crypto.randomUUID();
    set((state) => ({
      tasks: [...state.tasks, { ...task, id }],
      isProcessing: true,
    }));
    return id;
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  removeTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  clearCompletedTasks: () => {
    set((state) => {
      const tasks = state.tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'failed'
      );
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  addVersion: (taskId, version) => {
    set((state) => {
      const history = state.taskHistory.get(taskId) || [];
      const newHistory = new Map(state.taskHistory);
      newHistory.set(taskId, [...history, version]);
      return { taskHistory: newHistory };
    });
  },

  getVersions: (taskId) => {
    return get().taskHistory.get(taskId) || [];
  },

  clearTaskHistory: (taskId) => {
    set((state) => {
      const newHistory = new Map(state.taskHistory);
      newHistory.delete(taskId);
      return { taskHistory: newHistory };
    });
  },
}));
