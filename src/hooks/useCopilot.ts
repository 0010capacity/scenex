// useCopilot Hook - Handles copilot chat and skill execution
// Coordinates between CopilotSidebar and Skills Framework

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useCopilotStore } from '@/stores/copilotStore';
import { skillsRegistry, getSkillDefinitions } from '@/ai/skills';
import type { CopilotContext, SkillCall, SkillResult, CopilotChatResponse as CopilotChatResponseType } from '@/ai/skills/types';
import type { Panel } from '@/types';

interface ChatResponse {
  message: string;
  skillCalls?: SkillCall[];
  skillResults?: SkillResult[];
}

/**
 * Hook for copilot functionality
 */
export function useCopilot() {
  const project = useProjectStore(s => s.project);
  const selectedSceneId = useProjectStore(s => s.selectedSceneId);
  const selectedPanelId = useProjectStore(s => s.selectedPanelId);
  const getSelectedScene = useProjectStore(s => s.getSelectedScene);
  const editorMode = useUIStore(s => s.editorMode);

  const addUserMessage = useCopilotStore(s => s.addUserMessage);
  const addAssistantMessage = useCopilotStore(s => s.addAssistantMessage);
  const setLoading = useCopilotStore(s => s.setLoading);

  /**
   * Find selected panel from project
   */
  const findSelectedPanel = useCallback((): Panel | null => {
    if (!project || !selectedPanelId) return null;
    for (const scene of project.scenario.scenes) {
      const panel = scene.panels.find(p => p.id === selectedPanelId);
      if (panel) return panel;
    }
    return null;
  }, [project, selectedPanelId]);

  /**
   * Build context object for copilot
   */
  const buildContext = useCallback((): CopilotContext => {
    const selectedScene = getSelectedScene();
    const selectedPanel = findSelectedPanel();
    const scenario = project?.scenario;

    return {
      mode: editorMode,
      selectedSceneId,
      selectedSceneName: selectedScene?.name ?? null,
      panelCount: selectedScene?.panels.length ?? null,
      selectedPanelId,
      selectedPanelNumber: selectedPanel?.number ?? null,
      panelShotType: selectedPanel?.shotType ?? null,
      panelDescription: selectedPanel?.description || null,
      panelDuration: selectedPanel?.duration || null,
      panelMoodTags: selectedPanel?.moodTags?.length ? selectedPanel.moodTags : null,
      // Scenario context
      selectedScenarioId: scenario?.id ?? null,
      selectedScenarioName: scenario?.name ?? null,
      scenarioDescription: scenario?.description || null,
    };
  }, [editorMode, selectedSceneId, selectedPanelId, project, getSelectedScene, findSelectedPanel]);

  /**
   * Execute skill calls and return results
   */
  const executeSkillCalls = useCallback(async (
    skillCalls: SkillCall[]
  ): Promise<SkillResult[]> => {
    const results: SkillResult[] = [];

    for (const call of skillCalls) {
      const result = await skillsRegistry.execute(
        call.skill,
        call.tool,
        {
          project,
          selectedSceneId,
          selectedPanelId,
          editorMode,
        },
        call.parameters
      );
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }, [project, selectedSceneId, selectedPanelId, editorMode]);

  /**
   * Send a message to copilot and handle the response
   */
  const sendMessage = useCallback(async (content: string): Promise<ChatResponse | null> => {
    if (!project) return null;

    addUserMessage(content);
    setLoading(true);

    try {
      // Build context
      const context = buildContext();

      // Call Tauri copilot_chat command
      const response = await invoke<CopilotChatResponseType>('copilot_chat', {
        request: {
          message: content,
          context,
        },
      });

      if (!response.success || !response.response) {
        addAssistantMessage(response.error || '응답을 처리할 수 없습니다.');
        return null;
      }

      const { thinking: _thinking, skill_calls, message } = response.response;

      // Parse skill calls
      const parsedSkillCalls: SkillCall[] = skill_calls.map((call: { skill: string; tool: string; parameters: Record<string, unknown> }) => ({
        skill: call.skill,
        tool: call.tool,
        parameters: call.parameters as Record<string, unknown>,
      }));

      // Execute skill calls if any
      let skillResults: SkillResult[] = [];
      if (parsedSkillCalls.length > 0) {
        skillResults = await executeSkillCalls(parsedSkillCalls);
      }

      // Build response message
      let finalMessage = message;

      // Append skill results summary if any
      if (skillResults.length > 0) {
        const successCount = skillResults.filter(r => r.success).length;
        if (successCount === skillResults.length) {
          finalMessage += ` (${successCount}개 작업 완료)`;
        } else {
          finalMessage += ` (${successCount}/${skillResults.length}개 성공)`;
        }
      }

      addAssistantMessage(finalMessage, parsedSkillCalls, skillResults);

      return {
        message: finalMessage,
        skillCalls: parsedSkillCalls,
        skillResults,
      };
    } catch (error) {
      console.error('Copilot error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addAssistantMessage(`오류가 발생했습니다: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [project, buildContext, executeSkillCalls, addUserMessage, addAssistantMessage, setLoading]);

  /**
   * Get available skills for current mode
   */
  const getAvailableSkills = useCallback(() => {
    return getSkillDefinitions(editorMode);
  }, [editorMode]);

  return {
    sendMessage,
    getAvailableSkills,
    buildContext,
  };
}
