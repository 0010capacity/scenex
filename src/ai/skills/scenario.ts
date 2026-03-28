// ScenarioSkill - Tools for scenario manipulation
// Provides create_scenario, edit_scenario, expand_scenario, condense_scenario, polish_scenario

import type { Skill, ToolExecutor } from './types';
import { getScenarioById } from './types';
import { registerSkill } from './registry';
import { useProjectStore } from '@/stores/projectStore';
import type { Scenario } from '@/types/scenario';

/**
 * Create a new scenario
 */
const createScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const name = (params.name as string) || 'Untitled Scenario';
  const content = params.content as string | undefined;  // Full story content
  const genre = params.genre as string | undefined;
  const mood = params.mood as string | undefined;

  // Create scenario with initial content
  const scenarioId = store.addScenario(name);

  // If content provided, use it directly
  // If only genre/mood provided (no content), create header with them
  if (content || genre || mood) {
    let initialContent: string;

    if (content) {
      // Content provided - use as-is
      initialContent = content;
    } else {
      // No content but genre/mood provided - create header
      let header = `# ${name}\n\n`;
      if (genre) {
        header += `@genre: ${genre}\n`;
      }
      if (mood) {
        header += `@mood: ${mood}\n`;
      }
      header += `\n---\n\n`;
      initialContent = header;
    }

    if (initialContent.trim()) {
      store.updateScenario(scenarioId, { content: initialContent });
    }
  }

  // Select the newly created scenario so it shows in the editor
  store.selectScenario(scenarioId);

  const scenario = getScenarioById(useProjectStore.getState().project!, scenarioId);

  return {
    success: true,
    data: { scenarioId },
    message: `시나리오 "${scenario?.name || name}"을(를) 생성했습니다.`,
  };
};

/**
 * Edit an existing scenario
 */
const editScenario: ToolExecutor<{ scenarioId: string }> = (ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenarioId = (params.scenario_id as string) || ctx.selectedScenarioId;
  if (!scenarioId) {
    return { success: false, error: 'No scenario specified and no scenario selected' };
  }

  const scenario = getScenarioById(store.project, scenarioId);
  if (!scenario) {
    return { success: false, error: `Scenario not found: ${scenarioId}` };
  }

  const updates: Partial<Scenario> = {};

  if (params.name !== undefined) {
    updates.name = params.name as string;
  }
  if (params.description !== undefined) {
    updates.description = params.description as string;
  }
  if (params.content !== undefined) {
    updates.content = params.content as string;
  }
  if (params.append_content !== undefined) {
    updates.content = scenario.content + '\n\n' + (params.append_content as string);
  }
  if (params.prepend_content !== undefined) {
    updates.content = (params.prepend_content as string) + '\n\n' + scenario.content;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  store.updateScenario(scenarioId, updates);

  return {
    success: true,
    data: { scenarioId },
    message: `시나리오 "${scenario.name}"을(를) 수정했습니다.`,
  };
};

/**
 * Expand scenario with more content
 */
const expandScenario: ToolExecutor<{ scenarioId: string }> = (ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenarioId = (params.scenario_id as string) || ctx.selectedScenarioId;
  if (!scenarioId) {
    return { success: false, error: 'No scenario specified and no scenario selected' };
  }

  const scenario = getScenarioById(store.project, scenarioId);
  if (!scenario) {
    return { success: false, error: `Scenario not found: ${scenarioId}` };
  }

  const expansionType = params.expansion_type as string || 'scene';
  const newContent = params.content as string | undefined;

  if (!newContent) {
    return { success: false, error: 'No content provided for expansion' };
  }

  let updatedContent = scenario.content;

  switch (expansionType) {
    case 'scene':
      // Add a new scene
      updatedContent = scenario.content.trimEnd() + `\n\n### New Scene\n\n${newContent}\n`;
      break;
    case 'subplot':
      // Add a subplot section
      updatedContent = scenario.content.trimEnd() + `\n\n## Subplot\n\n${newContent}\n`;
      break;
    case 'character':
      // Add character development
      updatedContent = scenario.content.trimEnd() + `\n\n### Character Development\n\n${newContent}\n`;
      break;
    case 'dialogue':
      // Append dialogue to existing content
      updatedContent = scenario.content.trimEnd() + `\n\n${newContent}\n`;
      break;
    default:
      updatedContent = scenario.content + '\n\n' + newContent;
  }

  store.updateScenario(scenarioId, { content: updatedContent });

  return {
    success: true,
    data: { scenarioId },
    message: `시나리오 "${scenario.name}"에 새로운 내용을 추가했습니다.`,
  };
};

/**
 * Condense scenario to core beats
 */
const condenseScenario: ToolExecutor<{ scenarioId: string }> = (ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenarioId = (params.scenario_id as string) || ctx.selectedScenarioId;
  if (!scenarioId) {
    return { success: false, error: 'No scenario specified and no scenario selected' };
  }

  const scenario = getScenarioById(store.project, scenarioId);
  if (!scenario) {
    return { success: false, error: `Scenario not found: ${scenarioId}` };
  }

  const condensedContent = params.content as string | undefined;

  if (!condensedContent) {
    return { success: false, error: 'No condensed content provided' };
  }

  store.updateScenario(scenarioId, { content: condensedContent });

  return {
    success: true,
    data: { scenarioId },
    message: `시나리오 "${scenario.name}"을(를) 요약했습니다.`,
  };
};

/**
 * Polish scenario for better flow
 */
const polishScenario: ToolExecutor<{ scenarioId: string }> = (ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenarioId = (params.scenario_id as string) || ctx.selectedScenarioId;
  if (!scenarioId) {
    return { success: false, error: 'No scenario specified and no scenario selected' };
  }

  const scenario = getScenarioById(store.project, scenarioId);
  if (!scenario) {
    return { success: false, error: `Scenario not found: ${scenarioId}` };
  }

  const polishedContent = params.content as string | undefined;

  if (!polishedContent) {
    return { success: false, error: 'No polished content provided' };
  }

  store.updateScenario(scenarioId, { content: polishedContent });

  return {
    success: true,
    data: { scenarioId },
    message: `시나리오 "${scenario.name}"을(를) 다듬었습니다.`,
  };
};

// Skill definition
const scenarioSkill: Skill = {
  name: 'scenario',
  description: '시나리오 생성, 수정, 확장, 축약, 다듬기',
  modes: ['scenario'],
  tools: [
    {
      name: 'create_scenario',
      description: '새 시나리오 생성',
      parameters: {
        name: { type: 'string', optional: true, description: '시나리오 이름' },
        content: { type: 'string', optional: true, description: '시나리오 본문 내용 (스토리 전체)' },
        genre: { type: 'string', optional: true, description: '장르 (예: 액션, 로맨스, 스릴러)' },
        mood: { type: 'string', optional: true, description: '분위기 (예: 어두운, 밝은, 긴장감)' },
      },
    },
    {
      name: 'edit_scenario',
      description: '선택된 시나리오 수정',
      parameters: {
        scenario_id: { type: 'string', optional: true, description: '시나리오 ID (없으면 선택된 시나리오)' },
        name: { type: 'string', optional: true, description: '새 이름' },
        description: { type: 'string', optional: true, description: '시나리오 설명' },
        content: { type: 'string', optional: true, description: '전체 내용 교체' },
        append_content: { type: 'string', optional: true, description: '내용 뒤에 추가' },
        prepend_content: { type: 'string', optional: true, description: '내용 앞에 추가' },
      },
    },
    {
      name: 'expand_scenario',
      description: '시나리오 확장 (새 씬, 서브플롯, 대화 추가)',
      parameters: {
        scenario_id: { type: 'string', optional: true, description: '시나리오 ID (없으면 선택된 시나리오)' },
        expansion_type: {
          type: 'string',
          enum: ['scene', 'subplot', 'character', 'dialogue'],
          optional: true,
          default: 'scene',
          description: '확장 유형',
        },
        content: { type: 'string', optional: false, description: '추가할 내용' },
      },
    },
    {
      name: 'condense_scenario',
      description: '시나리오 축약 (핵심 비트만 남김)',
      parameters: {
        scenario_id: { type: 'string', optional: true, description: '시나리오 ID (없으면 선택된 시나리오)' },
        content: { type: 'string', optional: false, description: '축약된 내용' },
      },
    },
    {
      name: 'polish_scenario',
      description: '시나리오 다듬기 (생동감, 페이싱 개선)',
      parameters: {
        scenario_id: { type: 'string', optional: true, description: '시나리오 ID (없으면 선택된 시나리오)' },
        content: { type: 'string', optional: false, description: '다듬어진 내용' },
      },
    },
  ],
};

// Register skill with executors
registerSkill(scenarioSkill, {
  create_scenario: createScenario,
  edit_scenario: editScenario,
  expand_scenario: expandScenario,
  condense_scenario: condenseScenario,
  polish_scenario: polishScenario,
});

export { scenarioSkill };
