/**
 * Claude CLI AI Provider
 * Uses the Claude Code CLI for AI generation
 */

import { invoke } from '@tauri-apps/api/core';
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
  ClaudeStatus,
} from '../types';

export class ClaudeProvider implements AIProvider {
  async checkAvailability(): Promise<ClaudeStatus> {
    try {
      const status = await invoke<ClaudeStatus>('check_claude_available');
      return status;
    } catch {
      return { available: false, version: null, path: null };
    }
  }

  async generatePanel(request: GeneratePanelRequest): Promise<GeneratePanelResponse> {
    try {
      const response = await invoke<GeneratePanelResponse>('generate_panel', {
        request,
      });
      return response;
    } catch (error) {
      return {
        svg_data: null,
        description: request.description,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async generateScriptLines(
    request: GenerateScriptLinesRequest
  ): Promise<GenerateScriptLinesResponse> {
    try {
      const response = await invoke<GenerateScriptLinesResponse>('generate_script_lines', {
        request,
      });
      return response;
    } catch (error) {
      return {
        script_lines: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async generateDescriptionSuggestion(
    request: GenerateDescriptionSuggestionRequest
  ): Promise<GenerateDescriptionSuggestionResponse> {
    try {
      const response = await invoke<GenerateDescriptionSuggestionResponse>(
        'generate_description_suggestion',
        { request }
      );
      return response;
    } catch (error) {
      return {
        suggestion: null,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async batchGeneratePanels(request: BatchGenerateRequest): Promise<BatchGenerateResponse> {
    try {
      const response = await invoke<BatchGenerateResponse>('batch_generate_panels', {
        request,
      });
      return response;
    } catch (error) {
      return {
        panels: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async generateScenario(request: GenerateScenarioRequest): Promise<GenerateScenarioResponse> {
    try {
      const response = await invoke<GenerateScenarioResponse>('generate_scenario', {
        request,
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async regeneratePanel(request: RegeneratePanelRequest): Promise<RegeneratePanelResponse> {
    try {
      const response = await invoke<RegeneratePanelResponse>('regenerate_panel', {
        request,
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
