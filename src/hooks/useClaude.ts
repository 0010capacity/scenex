import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAIStore } from '@/stores/aiStore';
import { getAIProvider } from '@/ai';
import type {
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
} from '@/ai/types';

export function useClaude() {
  const { setClaudeStatus } = useUIStore();
  const { addTask, updateTask } = useAIStore();
  const provider = getAIProvider();

  const checkAvailability = useCallback(async (): Promise<ClaudeStatus> => {
    try {
      const status = await provider.checkAvailability();
      setClaudeStatus(status.available ? 'available' : 'unavailable');
      return status;
    } catch (error) {
      console.error('Failed to check Claude availability:', error);
      setClaudeStatus('unavailable');
      return { available: false, version: null, path: null };
    }
  }, [provider, setClaudeStatus]);

  const generatePanel = useCallback(
    async (
      description: string,
      shotType?: string,
      moodTags: string[] = []
    ): Promise<GeneratePanelResponse> => {
      const request: GeneratePanelRequest = {
        description,
        shot_type: shotType,
        mood_tags: moodTags,
      };
      return provider.generatePanel(request);
    },
    [provider]
  );

  const generateScriptLines = useCallback(
    async (slugline: string): Promise<GenerateScriptLinesResponse> => {
      const request: GenerateScriptLinesRequest = { slugline };
      return provider.generateScriptLines(request);
    },
    [provider]
  );

  const generateDescriptionSuggestion = useCallback(
    async (currentDescription: string): Promise<GenerateDescriptionSuggestionResponse> => {
      const request: GenerateDescriptionSuggestionRequest = {
        current_description: currentDescription,
      };
      return provider.generateDescriptionSuggestion(request);
    },
    [provider]
  );

  const batchGeneratePanels = useCallback(
    async (
      sceneDescription: string,
      panelCount: number,
      shotTypeHint?: string,
      moodTags?: string[]
    ): Promise<BatchGenerateResponse> => {
      const request: BatchGenerateRequest = {
        scene_description: sceneDescription,
        panel_count: panelCount,
        shot_type_hint: shotTypeHint,
        mood_tags: moodTags || [],
      };
      return provider.batchGeneratePanels(request);
    },
    [provider]
  );

  const generateScenario = useCallback(
    async (concept: string, genre?: string, mood?: string): Promise<GenerateScenarioResponse> => {
      const taskId = addTask({
        type: 'generate_scenario',
        status: 'running',
        progress: 0,
        message: 'Generating scenario...',
      });

      try {
        const request: GenerateScenarioRequest = { concept, genre, mood };
        const response = await provider.generateScenario(request);

        if (response.success) {
          updateTask(taskId, { status: 'completed', progress: 100 });
        } else {
          updateTask(taskId, {
            status: 'failed',
            message: response.error || 'Generation failed',
          });
        }

        return response;
      } catch (error) {
        updateTask(taskId, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [provider, addTask, updateTask]
  );

  const regeneratePanel = useCallback(
    async (
      previousSvg: string,
      previousDescription: string,
      userFeedback: string,
      sceneContext?: string
    ): Promise<RegeneratePanelResponse> => {
      const taskId = addTask({
        type: 'regenerate_panel',
        status: 'running',
        progress: 0,
        message: 'Regenerating panel...',
      });

      try {
        const request: RegeneratePanelRequest = {
          previous_svg: previousSvg,
          previous_description: previousDescription,
          user_feedback: userFeedback,
          scene_context: sceneContext,
        };
        const response = await provider.regeneratePanel(request);

        if (response.success) {
          updateTask(taskId, { status: 'completed', progress: 100 });
        } else {
          updateTask(taskId, {
            status: 'failed',
            message: response.error || 'Regeneration failed',
          });
        }

        return response;
      } catch (error) {
        updateTask(taskId, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [provider, addTask, updateTask]
  );

  return {
    checkAvailability,
    generatePanel,
    generateScriptLines,
    generateDescriptionSuggestion,
    batchGeneratePanels,
    generateScenario,
    regeneratePanel,
  };
}
