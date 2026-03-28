/**
 * Mock AI Provider
 * For testing and development without actual AI backend
 */

import type {
  AIProvider,
  GeneratePanelRequest,
  GeneratePanelResponse,
  GenerateScriptLinesRequest,
  GenerateScriptLinesResponse,
  GenerateDescriptionSuggestionRequest,
  GenerateDescriptionSuggestionResponse,
  BatchGenerateRequest,
  BatchGenerateResponse,
  GenerateScenarioRequest,
  GenerateScenarioResponse,
  RegeneratePanelRequest,
  RegeneratePanelResponse,
  ScenarioToStoryboardRequest,
  ScenarioToStoryboardResponse,
  ClaudeStatus,
  ScriptLineDto,
} from '../types';

export class MockProvider implements AIProvider {
  private available: boolean;

  constructor(available = true) {
    this.available = available;
  }

  async checkAvailability(): Promise<ClaudeStatus> {
    return {
      available: this.available,
      version: this.available ? 'mock-version' : null,
      path: this.available ? '/usr/local/bin/claude' : null,
    };
  }

  async generatePanel(request: GeneratePanelRequest): Promise<GeneratePanelResponse> {
    await this.delay(500);
    return {
      svg_data: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#f0f0f0" width="400" height="300"/>
        <text x="200" y="150" text-anchor="middle" fill="#666">Mock Panel</text>
      </svg>`,
      description: request.description,
      success: true,
      error: null,
    };
  }

  async generateScriptLines(
    _request: GenerateScriptLinesRequest
  ): Promise<GenerateScriptLinesResponse> {
    await this.delay(300);
    const scriptLines: ScriptLineDto[] = [
      { line_type: 'action', text: 'Character enters the room slowly.', character: null },
      { line_type: 'dialogue', text: 'Hello?', character: 'CHARACTER' },
      { line_type: 'action', text: 'Silence fills the space.', character: null },
    ];
    return { script_lines: scriptLines, success: true, error: null };
  }

  async generateDescriptionSuggestion(
    request: GenerateDescriptionSuggestionRequest
  ): Promise<GenerateDescriptionSuggestionResponse> {
    await this.delay(200);
    return {
      suggestion: `${request.current_description} - enhanced with dramatic lighting and emotional depth.`,
      success: true,
      error: null,
    };
  }

  async batchGeneratePanels(request: BatchGenerateRequest): Promise<BatchGenerateResponse> {
    await this.delay(1000);
    const panels = Array.from({ length: request.panel_count }, (_, i) => ({
      description: `Scene ${i + 1}: ${request.scene_description.slice(0, 30)}`,
      shot_type: request.shot_type_hint || 'MS',
      duration: '3s',
      svg_data: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#e8e8e8" width="400" height="300"/>
        <text x="200" y="150" text-anchor="middle" fill="#666">Panel ${i + 1}</text>
      </svg>`,
    }));
    return { panels, success: true, error: null };
  }

  async generateScenario(request: GenerateScenarioRequest): Promise<GenerateScenarioResponse> {
    await this.delay(1500);
    const scenario = {
      id: crypto.randomUUID(),
      name: request.concept,
      description: `A ${request.genre || 'drama'} about ${request.concept}`,
      content: `# ${request.concept}\n\n## Act 1\n\nThe story begins...\n`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, scenario, error: null };
  }

  async regeneratePanel(request: RegeneratePanelRequest): Promise<RegeneratePanelResponse> {
    await this.delay(800);
    return {
      success: true,
      svg_data: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#f5f5f5" width="400" height="300"/>
        <text x="200" y="150" text-anchor="middle" fill="#666">Regenerated</text>
        <text x="200" y="170" text-anchor="middle" fill="#999" font-size="12">${request.user_feedback.slice(0, 40)}</text>
      </svg>`,
      error: null,
    };
  }

  async scenarioToStoryboard(
    request: ScenarioToStoryboardRequest
  ): Promise<ScenarioToStoryboardResponse> {
    await this.delay(1500);
    const panelCount = request.panel_count ?? 16;

    const mockPanels = Array.from({ length: panelCount }, (_, i) => ({
      scene_index: i % 3,
      scene_name: `Scene ${(i % 3) + 1}`,
      description: `Mock panel ${i + 1} for scenario`,
      shot_type: ['WS', 'MS', 'CU'][i % 3],
      duration: '3s',
      mood: 'neutral',
    }));

    return { success: true, panels: mockPanels, error: null };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
