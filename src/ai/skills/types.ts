// Skills Framework Types
// Each skill has tools that can be executed by the AI agent

import type { Panel, Scene, Project } from '@/types';
import type { Scenario } from '@/types/scenario';

/**
 * Tool parameter for skill definitions
 */
export interface ToolParameter {
  type: string;
  enum?: string[];
  items?: { type: string };
  optional?: boolean;
  default?: unknown;
  description?: string;
}

/**
 * Tool definition for skill definitions
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

/**
 * Skill definition - a collection of related tools
 */
export interface Skill {
  name: string;
  description: string;
  modes: EditorMode[];
  tools: Tool[];
}

export type EditorMode = 'storyboard' | 'scenario';

/**
 * Context provided to skill executors
 */
export interface SkillContext {
  project: Project | null;
  selectedSceneId: string | null;
  selectedPanelId: string | null;
  selectedScenarioId: string | null;
  editorMode: EditorMode;
}

/**
 * Result from executing a tool
 */
export interface SkillResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * A skill call from the AI
 */
export interface SkillCall {
  skill: string;
  tool: string;
  parameters: Record<string, unknown>;
}

/**
 * AI response containing skill calls
 */
export interface CopilotResponse {
  thinking: string;
  skill_calls: SkillCall[];
  message: string;
}

/**
 * Chat message for copilot
 */
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  skillCalls?: SkillCall[];
  skillResults?: SkillResult[];
}

/**
 * Context sent to copilot (frontend -> backend)
 */
export interface CopilotContext {
  mode: string;
  selectedSceneId: string | null;
  selectedSceneName: string | null;
  panelCount: number | null;
  selectedPanelId: string | null;
  selectedPanelNumber: number | null;
  panelShotType: string | null;
  panelDescription: string | null;
  panelDuration: string | null;
  panelMoodTags: string[] | null;
  // Scenario context
  selectedScenarioId: string | null;
  selectedScenarioName: string | null;
  scenarioDescription: string | null;
}

/**
 * Backend copilot response
 */
export interface CopilotBackendResponse {
  thinking: string;
  skill_calls: Array<{
    skill: string;
    tool: string;
    parameters: Record<string, unknown>;
  }>;
  message: string;
}

/**
 * Backend response wrapper
 */
export interface CopilotChatResponse {
  success: boolean;
  response: CopilotBackendResponse | null;
  error: string | null;
}

/**
 * Tool executor function type
 */
export type ToolExecutor<T = unknown> = (
  ctx: SkillContext,
  params: Record<string, unknown>
) => Promise<SkillResult<T>> | SkillResult<T>;

/**
 * Registered skill with executors
 */
export interface RegisteredSkill extends Skill {
  executors: Record<string, ToolExecutor>;
}

/**
 * Helper to get selected scene from context
 */
export function getSelectedScene(ctx: SkillContext): Scene | null {
  if (!ctx.project || !ctx.selectedSceneId) return null;
  return ctx.project.scenes.find(s => s.id === ctx.selectedSceneId) ?? null;
}

/**
 * Helper to get selected panel from context
 */
export function getSelectedPanel(ctx: SkillContext): { scene: Scene; panel: Panel } | null {
  if (!ctx.project || !ctx.selectedPanelId) return null;

  for (const scene of ctx.project.scenes) {
    const panel = scene.panels.find(p => p.id === ctx.selectedPanelId);
    if (panel) {
      return { scene, panel };
    }
  }
  return null;
}

/**
 * Helper to get panel by ID from project
 */
export function getPanelById(project: Project, panelId: string): { scene: Scene; panel: Panel } | null {
  for (const scene of project.scenes) {
    const panel = scene.panels.find(p => p.id === panelId);
    if (panel) {
      return { scene, panel };
    }
  }
  return null;
}

/**
 * Helper to get scene by ID from project
 */
export function getSceneById(project: Project, sceneId: string): Scene | null {
  return project.scenes.find(s => s.id === sceneId) ?? null;
}

/**
 * Helper to get scenario by ID from project
 */
export function getScenarioById(project: Project, scenarioId: string): Scenario | null {
  return project.scenarios.find(s => s.id === scenarioId) ?? null;
}
