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

export interface AITask {
  id: string;
  type: AITaskType;
  status: 'pending' | 'running' | 'completed' | 'failed';
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
