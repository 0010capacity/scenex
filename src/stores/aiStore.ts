import { create } from 'zustand';
import type { AITask, AITaskVersion, AITaskStatus, AITaskPriority } from '@/types/ai';
import { DEFAULT_MAX_CONCURRENT_TASKS, MAX_TASK_HISTORY_SIZE } from '@/constants';

// Re-export for convenience
export type { AITaskStatus, AITaskPriority } from '@/types/ai';

interface AIState {
  tasks: AITask[];
  isProcessing: boolean;
  taskHistory: AITask[];
  maxConcurrent: number;
  taskHistoryMap: Map<string, AITaskVersion[]>;

  // Core task management
  addTask: (task: Omit<AITask, 'id' | 'status' | 'progress' | 'priority'> & { status?: AITaskStatus; progress?: number; priority?: AITaskPriority }) => string;
  updateTask: (id: string, updates: Partial<AITask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // Task cancellation
  cancelTask: (id: string) => void;
  cancelAllTasks: () => void;

  // Retry
  retryTask: (id: string) => string | null;

  // Concurrency
  setMaxConcurrent: (max: number) => void;
  canStartNewTask: () => boolean;
  getRunningCount: () => number;

  // History
  addVersion: (taskId: string, version: AITaskVersion) => void;
  getVersions: (taskId: string) => AITaskVersion[];
  clearTaskHistory: (taskId: string) => void;

  // Query helpers
  getTaskById: (id: string) => AITask | undefined;
  getTasksByStatus: (status: AITaskStatus) => AITask[];
  getPendingTasks: () => AITask[]; // sorted by priority
}

export const useAIStore = create<AIState>((set, get) => ({
  tasks: [],
  isProcessing: false,
  taskHistory: [],
  maxConcurrent: DEFAULT_MAX_CONCURRENT_TASKS,
  taskHistoryMap: new Map<string, AITaskVersion[]>(),

  addTask: (task) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newTask: AITask = {
      ...task,
      id,
      status: task.status || 'pending',
      progress: task.progress || 0,
      priority: task.priority || 'normal',
    };

    // Add to history if this is a retry (has previousVersionId)
    if (task.previousVersionId) {
      const original = get().tasks.find((t) => t.id === task.previousVersionId);
      if (original) {
        set((state) => ({
          taskHistory: [
            { ...original, completedAt: now },
            ...state.taskHistory,
          ].slice(0, MAX_TASK_HISTORY_SIZE),
        }));
      }
    }

    set((state) => {
      const tasks = [...state.tasks, newTask];
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
    return id;
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        // Set startedAt when transitioning to running
        if (updates.status === 'running' && !t.startedAt) {
          updated.startedAt = Date.now();
        }
        // Set completedAt when transitioning to terminal state
        if (
          updates.status === 'completed' ||
          updates.status === 'failed' ||
          updates.status === 'cancelled'
        ) {
          updated.completedAt = Date.now();
        }
        return updated;
      });
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  removeTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      // Archive to history before removing
      set((state) => ({
        taskHistory: [
          { ...task, completedAt: task.completedAt || Date.now() },
          ...state.taskHistory,
        ].slice(0, MAX_TASK_HISTORY_SIZE),
      }));
    }

    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  clearCompletedTasks: () => {
    const { tasks } = get();
    const completed = tasks.filter(
      (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
    );

    if (completed.length > 0) {
      set((state) => ({
        taskHistory: [
          ...completed.map((t) => ({ ...t, completedAt: t.completedAt || Date.now() })),
          ...state.taskHistory,
        ].slice(0, MAX_TASK_HISTORY_SIZE),
      }));
    }

    set((state) => {
      const tasks = state.tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled'
      );
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  cancelTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status !== 'pending' && task.status !== 'running') return;

    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'cancelled' as AITaskStatus, completedAt: Date.now() }
          : t
      );
      const isProcessing = tasks.some(
        (t) => t.status === 'pending' || t.status === 'running'
      );
      return { tasks, isProcessing };
    });
  },

  cancelAllTasks: () => {
    set((state) => {
      const now = Date.now();
      const tasks = state.tasks.map((t) =>
        t.status === 'pending' || t.status === 'running'
          ? { ...t, status: 'cancelled' as AITaskStatus, completedAt: now }
          : t
      );
      return { tasks, isProcessing: false };
    });
  },

  retryTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return null;
    if (task.status !== 'failed' && task.status !== 'cancelled') return null;

    // Remove original task
    get().removeTask(id);

    // Create new task with same config
    const { id: _id, status: _s, progress: _p, startedAt: _sa, completedAt: _ca, ...taskConfig } = task;
    return get().addTask({
      ...taskConfig,
      previousVersionId: id,
    });
  },

  setMaxConcurrent: (max) => {
    set({ maxConcurrent: Math.max(1, max) });
  },

  canStartNewTask: () => {
    const runningCount = get().getRunningCount();
    return runningCount < get().maxConcurrent;
  },

  getRunningCount: () => {
    return get().tasks.filter((t) => t.status === 'running').length;
  },

  addVersion: (taskId, version) => {
    const historyMap = get().taskHistoryMap;
    const history = historyMap.get(taskId) || [];
    historyMap.set(taskId, [...history, version]);
    set({ taskHistoryMap: new Map(historyMap) });
  },

  getVersions: (taskId) => {
    return get().taskHistoryMap.get(taskId) || [];
  },

  clearTaskHistory: (taskId) => {
    const historyMap = get().taskHistoryMap;
    historyMap.delete(taskId);
    set({ taskHistoryMap: new Map(historyMap) });
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status);
  },

  getPendingTasks: () => {
    const priorityOrder: Record<AITaskPriority, number> = { high: 0, normal: 1, low: 2 };
    return get()
      .tasks.filter((t) => t.status === 'pending')
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  },
}));
