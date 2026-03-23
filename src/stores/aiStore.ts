import { create } from 'zustand';

interface AITask {
  id: string;
  type: 'generate_panel' | 'batch_generate' | 'enhance';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  panelId?: string;
  sceneId?: string;
}

interface AIState {
  tasks: AITask[];
  isProcessing: boolean;

  addTask: (task: Omit<AITask, 'id'>) => string;
  updateTask: (id: string, updates: Partial<AITask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  tasks: [],
  isProcessing: false,

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
}));
