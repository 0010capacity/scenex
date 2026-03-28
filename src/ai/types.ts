// AI Provider Types
// These types define the interface for AI providers (Claude CLI, OpenAI, etc.)

export interface GeneratePanelRequest {
  description: string;
  shot_type?: string;
  mood_tags: string[];
}

export interface GeneratePanelResponse {
  svg_data: string | null;
  description: string;
  success: boolean;
  error: string | null;
}

export interface ScriptLineDto {
  line_type: string;
  text: string;
  character: string | null;
}

export interface GenerateScriptLinesRequest {
  slugline: string;
}

export interface GenerateScriptLinesResponse {
  script_lines: ScriptLineDto[];
  success: boolean;
  error: string | null;
}

export interface GenerateDescriptionSuggestionRequest {
  current_description: string;
}

export interface GenerateDescriptionSuggestionResponse {
  suggestion: string | null;
  success: boolean;
  error: string | null;
}

export interface BatchGeneratePanel {
  description: string;
  shot_type: string;
  duration: string;
  svg_data: string | null;
}

export interface BatchGenerateRequest {
  scene_description: string;
  shot_type_hint?: string;
  mood_tags: string[];
  panel_count: number;
}

export interface BatchGenerateResponse {
  panels: BatchGeneratePanel[];
  success: boolean;
  error: string | null;
}

export interface GenerateScenarioRequest {
  concept: string;
  genre?: string;
  mood?: string;
}

export interface GenerateScenarioResponse {
  success: boolean;
  scenario?: unknown;
  error: string | null;
}

export interface RegeneratePanelRequest {
  previous_svg: string;
  previous_description: string;
  user_feedback: string;
  scene_context?: string;
}

export interface RegeneratePanelResponse {
  success: boolean;
  svg_data?: string | null;
  error: string | null;
}

export interface ScenarioToStoryboardPanel {
  scene_index: number;
  scene_name: string;
  description: string;
  shot_type: string;
  duration: string;
  mood: string;
}

export interface ScenarioToStoryboardRequest {
  scenario_json: string;
  panel_count?: number;
}

export interface ScenarioToStoryboardResponse {
  success: boolean;
  panels: ScenarioToStoryboardPanel[] | null;
  error: string | null;
}

export interface ClaudeStatus {
  available: boolean;
  version: string | null;
  path: string | null;
}

/**
 * AI Provider interface
 * Implement this interface to add new AI backends (Claude CLI, OpenAI, Anthropic API, etc.)
 */
export interface AIProvider {
  /** Check if the AI backend is available */
  checkAvailability(): Promise<ClaudeStatus>;

  /** Generate a single panel SVG */
  generatePanel(request: GeneratePanelRequest): Promise<GeneratePanelResponse>;

  /** Generate script lines from a slugline */
  generateScriptLines(request: GenerateScriptLinesRequest): Promise<GenerateScriptLinesResponse>;

  /** Generate an improved description suggestion */
  generateDescriptionSuggestion(request: GenerateDescriptionSuggestionRequest): Promise<GenerateDescriptionSuggestionResponse>;

  /** Batch generate multiple panels for a scene */
  batchGeneratePanels(request: BatchGenerateRequest): Promise<BatchGenerateResponse>;

  /** Generate a scenario from concept */
  generateScenario(request: GenerateScenarioRequest): Promise<GenerateScenarioResponse>;

  /** Regenerate a panel with user feedback */
  regeneratePanel(request: RegeneratePanelRequest): Promise<RegeneratePanelResponse>;

  /** Convert scenario to storyboard panel specs */
  scenarioToStoryboard(request: ScenarioToStoryboardRequest): Promise<ScenarioToStoryboardResponse>;
}

/**
 * Provider type identifiers
 */
export type AIProviderType = 'claude' | 'openai' | 'anthropic' | 'mock';
