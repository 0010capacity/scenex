import { invoke } from '@tauri-apps/api/core';
import { useUIStore } from '@/stores/uiStore';
import { invokeWrapper } from '@/utils/invokeWrapper';

interface ClaudeStatus {
  available: boolean;
  version: string | null;
  path: string | null;
}

interface GeneratePanelRequest {
  description: string;
  shot_type?: string;
  mood_tags: string[];
}

interface GeneratePanelResponse {
  svg_data: string | null;
  description: string;
  success: boolean;
  error: string | null;
}

interface ScriptLineDto {
  line_type: string;
  text: string;
  character: string | null;
}

interface GenerateScriptLinesResponse {
  script_lines: ScriptLineDto[];
  success: boolean;
  error: string | null;
}

interface GenerateDescriptionSuggestionResponse {
  suggestion: string | null;
  success: boolean;
  error: string | null;
}

interface BatchGeneratePanel {
  description: string;
  shot_type: string;
  duration: string;
}

interface BatchGenerateResponse {
  panels: BatchGeneratePanel[];
  success: boolean;
  error: string | null;
}

export function useClaude() {
  const { setClaudeStatus } = useUIStore();

  const checkAvailability = async (): Promise<ClaudeStatus> => {
    try {
      const status = await invokeWrapper<ClaudeStatus>('check_claude_available');
      if (status) {
        setClaudeStatus(status.available ? 'available' : 'unavailable');
        return status;
      }
      setClaudeStatus('unavailable');
      return { available: false, version: null, path: null };
    } catch (error) {
      console.error('Failed to check Claude availability:', error);
      setClaudeStatus('unavailable');
      return { available: false, version: null, path: null };
    }
  };

  const generatePanel = async (
    description: string,
    shotType?: string,
    moodTags: string[] = []
  ): Promise<GeneratePanelResponse> => {
    const request: GeneratePanelRequest = {
      description,
      shot_type: shotType,
      mood_tags: moodTags,
    };

    try {
      const response = await invoke<GeneratePanelResponse>('generate_panel', {
        request,
      });
      return response;
    } catch (error) {
      return {
        svg_data: null,
        description,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const generateScriptLines = async (
    slugline: string
  ): Promise<GenerateScriptLinesResponse> => {
    try {
      const response = await invoke<GenerateScriptLinesResponse>('generate_script_lines', {
        request: { slugline },
      });
      return response;
    } catch (error) {
      return {
        script_lines: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const generateDescriptionSuggestion = async (
    currentDescription: string
  ): Promise<GenerateDescriptionSuggestionResponse> => {
    try {
      const response = await invoke<GenerateDescriptionSuggestionResponse>(
        'generate_description_suggestion',
        { request: { current_description: currentDescription } }
      );
      return response;
    } catch (error) {
      return {
        suggestion: null,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const batchGeneratePanels = async (
    sceneDescription: string,
    panelCount: number,
    shotTypeHint?: string,
    moodTags?: string[]
  ): Promise<BatchGenerateResponse> => {
    try {
      const response = await invoke<BatchGenerateResponse>('batch_generate_panels', {
        request: {
          scene_description: sceneDescription,
          panel_count: panelCount,
          shot_type_hint: shotTypeHint,
          mood_tags: moodTags || [],
        },
      });
      return response;
    } catch (error) {
      return {
        panels: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return {
    checkAvailability,
    generatePanel,
    generateScriptLines,
    generateDescriptionSuggestion,
    batchGeneratePanels,
  };
}
