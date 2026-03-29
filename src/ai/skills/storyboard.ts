// StoryboardSkill - Tools for storyboard panel manipulation
// Provides add_panel, edit_panel, delete_panel, draw_svg, reorder_panels, batch_edit

import type { Skill, SkillResult, ToolExecutor } from './types';
import { getPanelById, getSceneById } from './types';
import { registerSkill, validateParams, formatValidationErrors } from './registry';
import { skillLogger } from './logger';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { getAIProvider } from '@/ai';
import type { ShotType, MoodTag } from '@/types';
import {
  AddPanelParamsSchema,
  EditPanelParamsSchema,
  DeletePanelParamsSchema,
  DrawSvgParamsSchema,
  ReorderPanelsParamsSchema,
  BatchEditParamsSchema,
  GenerateStoryboardParamsSchema,
} from './schemas';

/**
 * Add a new panel to a scene
 */
const addPanel: ToolExecutor<{ panelId: string; sceneId: string }> = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(AddPanelParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'add_panel',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  // Determine target scene
  const sceneId = data.scene_id || ctx.selectedSceneId;
  if (!sceneId) {
    const result = { success: false, error: 'No scene specified and no scene selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'add_panel',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const scene = getSceneById(store.project!, sceneId);
  if (!scene) {
    const result = { success: false, error: `Scene not found: ${sceneId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'add_panel',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  // Create panel with provided parameters
  const panelData: Record<string, unknown> = {};

  if (data.shot_type) {
    panelData.shotType = data.shot_type as ShotType;
  }
  if (data.description) {
    panelData.description = data.description as string;
  }
  if (data.dialogue) {
    panelData.dialogue = data.dialogue as string;
  }
  if (data.sound) {
    panelData.sound = data.sound as string;
  }
  if (data.mood_tags) {
    panelData.moodTags = data.mood_tags as MoodTag[];
  }
  // duration and camera_movement are not in AddPanelParamsSchema but may be passed via raw params
  if (params.duration) {
    panelData.duration = params.duration as string;
  }
  if (params.camera_movement) {
    panelData.cameraMovement = params.camera_movement as string;
  }

  store.addPanel(sceneId, panelData);

  // Get the newly added panel
  const newScene = getSceneById(useProjectStore.getState().project!, sceneId);
  const newPanel = newScene?.panels[newScene.panels.length - 1];

  const result: SkillResult<{ panelId: string; sceneId: string }> = {
    success: true,
    data: {
      panelId: newPanel?.id ?? '',
      sceneId,
    },
    message: `Added panel ${newPanel?.number} to scene "${scene.name}"`,
  };

  // Optionally generate SVG
  // Note: style_hint is not in AddPanelParamsSchema but may be passed via raw params
  if (data.generate_svg === true && newPanel) {
    // Fire and forget SVG generation
    generateSVGForPanel(sceneId, newPanel.id, params.style_hint as string | undefined);
  }

  skillLogger.log({
    skill: 'storyboard',
    tool: 'add_panel',
    params,
    result: 'success',
    message: result.message,
    duration: Date.now() - startTime,
  });

  return result;
};

/**
 * Edit an existing panel
 */
const editPanel: ToolExecutor<{ panelId: string }> = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(EditPanelParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'edit_panel',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  // Determine target panel
  const panelId = data.panel_id || ctx.selectedPanelId;
  if (!panelId) {
    const result = { success: false, error: 'No panel specified and no panel selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'edit_panel',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panelInfo = getPanelById(store.project!, panelId);
  if (!panelInfo) {
    const result = { success: false, error: `Panel not found: ${panelId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'edit_panel',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  // Build updates
  const updates: Record<string, unknown> = {};

  if (data.shot_type !== undefined) {
    updates.shotType = data.shot_type;
  }
  if (data.description !== undefined) {
    updates.description = data.description;
  }
  if (data.dialogue !== undefined) {
    updates.dialogue = data.dialogue;
  }
  if (data.sound !== undefined) {
    updates.sound = data.sound;
  }
  if (data.mood_tags !== undefined) {
    updates.moodTags = data.mood_tags;
  }
  if (data.camera_movement !== undefined) {
    updates.cameraMovement = data.camera_movement;
  }
  if (data.duration !== undefined) {
    updates.duration = data.duration;
  }
  if (data.transition !== undefined) {
    updates.transition = data.transition;
  }

  if (Object.keys(updates).length === 0) {
    const result = { success: false, error: 'No updates provided' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'edit_panel',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  store.updatePanel(panelId, updates);

  const result: SkillResult<{ panelId: string }> = {
    success: true,
    data: { panelId },
    message: `Updated panel ${panelInfo.panel.number} in scene "${panelInfo.scene.name}"`,
  };

  skillLogger.log({
    skill: 'storyboard',
    tool: 'edit_panel',
    params,
    result: 'success',
    message: result.message,
    duration: Date.now() - startTime,
  });

  return result;
};

/**
 * Delete a panel
 */
const deletePanel: ToolExecutor = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(DeletePanelParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'delete_panel',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  const panelId = data.panel_id || ctx.selectedPanelId;
  if (!panelId) {
    const result = { success: false, error: 'No panel specified and no panel selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'delete_panel',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panelInfo = getPanelById(store.project!, panelId);
  if (!panelInfo) {
    const result = { success: false, error: `Panel not found: ${panelId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'delete_panel',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panelNumber = panelInfo.panel.number;
  const sceneName = panelInfo.scene.name;

  store.deletePanel(panelId);

  const result: SkillResult = {
    success: true,
    message: `Deleted panel ${panelNumber} from scene "${sceneName}"`,
  };

  skillLogger.log({
    skill: 'storyboard',
    tool: 'delete_panel',
    params,
    result: 'success',
    message: result.message,
    duration: Date.now() - startTime,
  });

  return result;
};

/**
 * Generate SVG for a panel
 */
const drawSvg: ToolExecutor<{ panelId: string; svgData: string }> = async (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(DrawSvgParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'draw_svg',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  const panelId = data.panel_id || ctx.selectedPanelId;
  if (!panelId) {
    const result = { success: false, error: 'No panel specified and no panel selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'draw_svg',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panelInfo = getPanelById(store.project!, panelId);
  if (!panelInfo) {
    const result = { success: false, error: `Panel not found: ${panelId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'draw_svg',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panel = panelInfo.panel;

  // Generate SVG using AI provider
  try {
    const provider = getAIProvider();
    const response = await provider.generatePanel({
      description: data.description as string || panel.description,
      shot_type: panel.shotType ?? undefined,
      mood_tags: panel.moodTags,
    });

    if (response.success && response.svg_data) {
      store.updatePanel(panelId, {
        svgData: response.svg_data,
        sourceType: 'ai',
      });

      const result: SkillResult<{ panelId: string; svgData: string }> = {
        success: true,
        data: { panelId, svgData: response.svg_data },
        message: `Generated SVG for panel ${panel.number}`,
      };

      skillLogger.log({
        skill: 'storyboard',
        tool: 'draw_svg',
        params,
        result: 'success',
        message: result.message,
        duration: Date.now() - startTime,
      });

      return result;
    } else {
      const result = { success: false, error: response.error || 'SVG generation failed' };
      skillLogger.log({
        skill: 'storyboard',
        tool: 'draw_svg',
        params,
        result: 'failed',
        error: result.error,
        duration: Date.now() - startTime,
      });
      return result;
    }
  } catch (error) {
    const result = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'draw_svg',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }
};

/**
 * Reorder panels within a scene
 */
const reorderPanels: ToolExecutor = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(ReorderPanelsParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'reorder_panels',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  const sceneId = data.scene_id || ctx.selectedSceneId;
  if (!sceneId) {
    const result = { success: false, error: 'No scene specified and no scene selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'reorder_panels',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const panelIds = data.panel_ids;
  const scene = getSceneById(store.project!, sceneId);
  if (!scene) {
    const result = { success: false, error: `Scene not found: ${sceneId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'reorder_panels',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  // Validate all panel IDs exist in scene
  const existingIds = new Set(scene.panels.map(p => p.id));
  for (const id of panelIds) {
    if (!existingIds.has(id)) {
      const result = { success: false, error: `Panel ${id} not found in scene` };
      skillLogger.log({
        skill: 'storyboard',
        tool: 'reorder_panels',
        params,
        result: 'failed',
        error: result.error,
        duration: Date.now() - startTime,
      });
      return result;
    }
  }

  // Reorder by moving panels to their new positions
  // This is a simplified implementation - in production, you might want a dedicated reorder action
  const currentPanels = [...scene.panels];
  const reorderedPanels = panelIds.map(id => currentPanels.find(p => p.id === id)!);

  // Update each panel's position by renumbering
  reorderedPanels.forEach((panel, index) => {
    if (panel.number !== index + 1) {
      // We need to find fromIndex and toIndex for this panel
      const fromIndex = currentPanels.findIndex(p => p.id === panel.id);
      if (fromIndex !== index) {
        store.reorderPanels(sceneId, fromIndex, index);
      }
    }
  });

  const result: SkillResult = {
    success: true,
    message: `Reordered ${panelIds.length} panels in scene "${scene.name}"`,
  };

  skillLogger.log({
    skill: 'storyboard',
    tool: 'reorder_panels',
    params,
    result: 'success',
    message: result.message,
    duration: Date.now() - startTime,
  });

  return result;
};

/**
 * Batch edit all panels in a scene
 */
const batchEdit: ToolExecutor<{ updatedCount: number }> = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(BatchEditParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'batch_edit',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  const sceneId = data.scene_id || ctx.selectedSceneId;
  if (!sceneId) {
    const result = { success: false, error: 'No scene specified and no scene selected' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'batch_edit',
      params,
      result: 'failed',
      message: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const scene = getSceneById(store.project!, sceneId);
  if (!scene) {
    const result = { success: false, error: `Scene not found: ${sceneId}` };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'batch_edit',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const updates: Partial<Record<string, unknown>> = {};
  let styleApplied = false;

  if (data.style) {
    styleApplied = applyStyle(scene, data.style as string, store);
  }

  if (data.mood_tags) {
    updates.moodTags = data.mood_tags;
  }

  if (data.default_duration) {
    updates.duration = data.default_duration;
  }

  // Apply common updates to all panels
  let updatedCount = 0;
  if (Object.keys(updates).length > 0) {
    for (const panel of scene.panels) {
      store.updatePanel(panel.id, updates);
      updatedCount++;
    }
  } else if (styleApplied) {
    updatedCount = scene.panels.length;
  }

  const result: SkillResult<{ updatedCount: number }> = {
    success: true,
    data: { updatedCount },
    message: `Updated ${updatedCount} panels in scene "${scene.name}"`,
  };

  skillLogger.log({
    skill: 'storyboard',
    tool: 'batch_edit',
    params,
    result: 'success',
    message: result.message,
    duration: Date.now() - startTime,
  });

  return result;
};

/**
 * Apply a cinematic style to all panels in a scene
 */
function applyStyle(scene: ReturnType<typeof getSceneById>, style: string, store: ReturnType<typeof useProjectStore.getState>): boolean {
  if (!scene) return false;

  const styleConfigs: Record<string, Partial<Record<string, unknown>>> = {
    slash_cut: { duration: '1s', transition: 'cut' },
    continuous: { duration: '3s', transition: 'dissolve' },
    montage: { duration: '2s', transition: 'cut' },
    slow_paced: { duration: '5s', transition: 'dissolve' },
    action: { duration: '1s', transition: 'cut' },
  };

  const config = styleConfigs[style.toLowerCase().replace('-', '_')];
  if (!config) return false;

  for (const panel of scene.panels) {
    store.updatePanel(panel.id, config);
  }

  return true;
}

/**
 * Generate entire storyboard from a scenario
 */
const generateStoryboard: ToolExecutor = async (_ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(GenerateStoryboardParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'generate_storyboard',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const data = validation.data;
  const store = useProjectStore.getState();

  const scenario = store.project?.scenario;
  console.debug('[generateStoryboard] Called with params:', params);
  console.debug('[generateStoryboard] Project exists:', !!store.project);
  console.debug('[generateStoryboard] Scenario exists:', !!scenario);
  console.debug('[generateStoryboard] Scenario content length:', scenario?.content?.length ?? 0);
  console.debug('[generateStoryboard] Scenario content preview:', scenario?.content?.slice(0, 200) ?? 'EMPTY');

  if (!scenario) {
    const result = { success: false, error: 'No scenario found' };
    skillLogger.log({
      skill: 'storyboard',
      tool: 'generate_storyboard',
      params,
      result: 'failed',
      error: result.error,
      duration: Date.now() - startTime,
    });
    return result;
  }

  const provider = getAIProvider();
  const panelCount = data.panel_count;

  const result = await provider.scenarioToStoryboard({
    scenario_json: scenario.content,
    panel_count: panelCount,
  });

  if (!result.success || !result.panels) {
    const err = result.error || 'Failed to generate storyboard';
    skillLogger.log({
      skill: 'storyboard',
      tool: 'generate_storyboard',
      params,
      result: 'failed',
      error: err,
      duration: Date.now() - startTime,
    });
    return { success: false, error: err };
  }

  const sceneMap = new Map<number, { name: string; panels: { description: string; shotType: ShotType; duration: string; moodTags: MoodTag[] }[] }>();

  for (const panel of result.panels) {
    const sceneIndex = panel.scene_index;
    if (!sceneMap.has(sceneIndex)) {
      sceneMap.set(sceneIndex, { name: panel.scene_name, panels: [] });
    }
    sceneMap.get(sceneIndex)!.panels.push({
      description: panel.description,
      shotType: panel.shot_type as ShotType,
      duration: panel.duration,
      moodTags: [panel.mood as MoodTag],
    });
  }

  // Get initial scene count to know which scenes we added
  const initialSceneCount = store.project!.scenario.scenes.length;

  // Add all scenes first
  for (const [, sceneData] of sceneMap) {
    store.addScene(sceneData.name);
  }

  // Get IDs of newly added scenes (they're at the end of the array)
  const newScenes = store.project!.scenario.scenes.slice(initialSceneCount);
  const sceneIds = newScenes.map(s => s.id);

  // Add panels to each scene
  for (let i = 0; i < newScenes.length; i++) {
    const sceneId = newScenes[i].id;
    const sceneIndex = Array.from(sceneMap.keys())[i];
    const sceneData = sceneMap.get(sceneIndex);
    if (sceneData) {
      for (const panelSpec of sceneData.panels) {
        store.addPanel(sceneId, panelSpec);
      }
    }
  }

  // Collect all panels for SVG generation
  const allPanels: { sceneId: string; panelId: string }[] = [];
  for (const sceneId of sceneIds) {
    const scene = getSceneById(store.project!, sceneId);
    if (scene) {
      for (const panel of scene.panels) {
        allPanels.push({ sceneId, panelId: panel.id });
      }
    }
  }

  // Fire and forget SVG generation with concurrency limit (3 at a time)
  const CONCURRENCY_LIMIT = 3;
  for (let i = 0; i < allPanels.length; i += CONCURRENCY_LIMIT) {
    const batch = allPanels.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(batch.map(({ sceneId, panelId }) => generateSVGForPanel(sceneId, panelId)));
  }

  const successResult: SkillResult = {
    success: true,
    data: { sceneCount: newScenes.length, panelCount: result.panels.length },
    message: `스토리보드 생성 완료: ${newScenes.length}개 씬, ${result.panels.length}개 패널`,
  };

  skillLogger.log({
    skill: 'storyboard',
    tool: 'generate_storyboard',
    params,
    result: 'success',
    message: successResult.message,
    duration: Date.now() - startTime,
  });

  return successResult;
};

/**
 * Generate SVG for a panel (async helper)
 */
async function generateSVGForPanel(_sceneId: string, panelId: string, styleHint?: string): Promise<void> {
  const store = useProjectStore.getState();
  const uiStore = useUIStore.getState();
  const panelInfo = getPanelById(store.project!, panelId);

  if (!panelInfo) {
    uiStore.addNotification('error', 'SVG 생성 실패: 패널을 찾을 수 없습니다.');
    return;
  }

  const provider = getAIProvider();
  const description = styleHint
    ? `${panelInfo.panel.description} (Style: ${styleHint})`
    : panelInfo.panel.description;

  try {
    const response = await provider.generatePanel({
      description,
      shot_type: panelInfo.panel.shotType ?? undefined,
      mood_tags: panelInfo.panel.moodTags,
    });

    if (response.success && response.svg_data) {
      store.updatePanel(panelId, {
        svgData: response.svg_data,
        sourceType: 'ai',
      });
      uiStore.addNotification('info', `패널 ${panelInfo.panel.number}의 SVG가 생성되었습니다.`);
    } else {
      const errorMsg = response.error || 'SVG 생성에 실패했습니다.';
      uiStore.addNotification('error', `패널 ${panelInfo.panel.number}: ${errorMsg}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    uiStore.addNotification('error', `패널 ${panelInfo.panel.number} SVG 생성 오류: ${errorMsg}`);
  }
}

// Skill definition
const storyboardSkill: Skill = {
  name: 'storyboard',
  description: '스토리보드 패널 생성, 수정, 삭제, SVG 생성',
  modes: ['storyboard'],
  tools: [
    {
      name: 'generate_storyboard',
      description: '시나리오에서 전체 스토리보드 생성',
      parameters: {
        panel_count: { type: 'number', optional: true, default: 16, description: '생성할 패널 수' },
      },
    },
    {
      name: 'add_panel',
      description: '새 패널 추가',
      parameters: {
        scene_id: { type: 'string', optional: true, description: '씬 ID (없으면 현재 씬)' },
        after_panel_id: { type: 'string', optional: true, description: '이 패널 뒤에 추가' },
        shot_type: {
          type: 'string',
          enum: ['EWS', 'WS', 'MS', 'CU', 'ECU', 'OTS', 'POV'],
          optional: true,
          description: '샷 타입',
        },
        description: { type: 'string', optional: true, description: '패널 묘사' },
        dialogue: { type: 'string', optional: true, description: '대사' },
        sound: { type: 'string', optional: true, description: '음향' },
        mood_tags: {
          type: 'array',
          items: { type: 'string' },
          optional: true,
          description: '무드 태그 (emotional, golden, tension, humor, excitement, sadness)',
        },
        generate_svg: { type: 'boolean', optional: true, default: false, description: 'SVG 자동 생성' },
      },
    },
    {
      name: 'edit_panel',
      description: '선택된 패널 수정',
      parameters: {
        panel_id: { type: 'string', optional: true, description: '패널 ID (없으면 선택된 패널)' },
        shot_type: {
          type: 'string',
          enum: ['EWS', 'WS', 'MS', 'CU', 'ECU', 'OTS', 'POV'],
          optional: true,
        },
        description: { type: 'string', optional: true },
        dialogue: { type: 'string', optional: true },
        sound: { type: 'string', optional: true },
        mood_tags: { type: 'array', items: { type: 'string' }, optional: true },
        camera_movement: {
          type: 'string',
          enum: ['Static', 'Pan', 'Tilt', 'Dolly', 'Pullback'],
          optional: true,
        },
        duration: { type: 'string', optional: true, description: '예: 2s, 3s, 5s' },
        transition: {
          type: 'string',
          enum: ['cut', 'fadein', 'fadeout', 'dissolve'],
          optional: true,
        },
      },
    },
    {
      name: 'delete_panel',
      description: '패널 삭제',
      parameters: {
        panel_id: { type: 'string', optional: true, description: '패널 ID (없으면 선택된 패널)' },
      },
    },
    {
      name: 'draw_svg',
      description: '패널에 SVG 스케치 생성',
      parameters: {
        panel_id: { type: 'string', optional: true, description: '패널 ID (없으면 선택된 패널)' },
        description: { type: 'string', optional: true, description: 'SVG 생성용 묘사 (없으면 기존 묘사 사용)' },
        style_hint: { type: 'string', optional: true, description: '스타일 힌트 (minimal, detailed, sketch)' },
      },
    },
    {
      name: 'reorder_panels',
      description: '패널 순서 변경',
      parameters: {
        scene_id: { type: 'string', optional: true, description: '씬 ID (없으면 현재 씬)' },
        panel_ids: {
          type: 'array',
          items: { type: 'string' },
          optional: false,
          description: '새 순서대로 패널 ID 배열',
        },
      },
    },
    {
      name: 'batch_edit',
      description: '씬의 모든 패널 일괄 수정',
      parameters: {
        scene_id: { type: 'string', optional: true, description: '씬 ID (없으면 현재 씬)' },
        style: {
          type: 'string',
          enum: ['slash_cut', 'continuous', 'montage', 'slow_paced', 'action'],
          optional: true,
          description: '시네마틱 스타일',
        },
        mood_tags: { type: 'array', items: { type: 'string' }, optional: true },
        default_duration: { type: 'string', optional: true, description: '기본 지속 시간' },
      },
    },
  ],
};

// Register skill with executors
registerSkill(storyboardSkill, {
  add_panel: addPanel,
  edit_panel: editPanel,
  delete_panel: deletePanel,
  draw_svg: drawSvg,
  reorder_panels: reorderPanels,
  batch_edit: batchEdit,
  generate_storyboard: generateStoryboard,
});

export { storyboardSkill };
