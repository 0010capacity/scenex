// AI-related types for task tracking and version management

export interface GenerationMetadata {
  promptVersion: string;
  promptTemplate: string;
  model?: string;
  generatedAt: string;
  generationDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface PanelVersion {
  version: number;
  svgData: string | null;
  description: string;
  shotType: string;
  duration: string;
  generationMeta: GenerationMetadata;
  createdAt: string;
}

export interface AITaskVersion {
  id: string;
  panelId: string;
  version: number;
  svgData: string | null;
  description: string;
  generationMeta: GenerationMetadata;
  createdAt: string;
}

export type AITaskType =
  | 'generate_panel'
  | 'batch_generate'
  | 'enhance'
  | 'generate_scenario'
  | 'regenerate_panel'
  | 'compare_versions'
  | 'polish_scenario'
  | 'expand_scenario'
  | 'condense_scenario'
  | 'scenario_to_storyboard'
  | 'script_generation';

export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AITaskPriority = 'low' | 'normal' | 'high';

export interface AITask {
  id: string;
  type: AITaskType;
  status: AITaskStatus;
  progress: number;
  message: string;
  priority: AITaskPriority;
  parentTaskId?: string;
  previousVersionId?: string;
  promptVersion?: string;
  timeout?: number;
  startedAt?: number;
  completedAt?: number;
  metadata?: {
    scenarioId?: string;
    actId?: string;
    sceneId?: string;
    panelId?: string;
    version?: number;
  };
}
