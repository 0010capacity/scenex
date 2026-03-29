// ScenarioSkill - Tools for scenario manipulation
// Single scenario per project - provides edit_scenario, expand_scenario, condense_scenario, polish_scenario

import type { Skill, ToolExecutor } from './types';
import { registerSkill } from './registry';
import { validateParams, formatValidationErrors } from './registry';
import { skillLogger } from './logger';
import { useProjectStore } from '@/stores/projectStore';
import type { Scenario } from '@/types/scenario';
import {
  EditScenarioParamsSchema,
  ExpandScenarioParamsSchema,
  CondenseScenarioParamsSchema,
  PolishScenarioParamsSchema,
} from './schemas';

/**
 * Edit the project scenario
 */
const editScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const startTime = Date.now();

  // Validate params
  const validation = validateParams(EditScenarioParamsSchema, params);
  if (!validation.success) {
    return {
      success: false,
      error: `Invalid params:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  const updates: Partial<Scenario> = {};

  if (validation.data.name !== undefined) {
    updates.name = validation.data.name;
  }
  if (validation.data.description !== undefined) {
    updates.description = validation.data.description;
  }
  if (validation.data.content !== undefined) {
    updates.content = validation.data.content;
  }
  if (validation.data.append_content !== undefined) {
    updates.content = scenario.content + '\n\n' + validation.data.append_content;
  }
  if (validation.data.prepend_content !== undefined) {
    updates.content = validation.data.prepend_content + '\n\n' + scenario.content;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  store.updateScenario(updates);

  skillLogger.log({
    skill: 'scenario',
    tool: 'edit_scenario',
    params,
    result: 'success',
    message: `시나리오 "${scenario.name}"을(를) 수정했습니다.`,
    duration: Date.now() - startTime,
  });

  return {
    success: true,
    data: { scenarioId: scenario.id },
    message: `시나리오 "${scenario.name}"을(를) 수정했습니다.`,
  };
};

/**
 * Expand scenario with more content
 */
const expandScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const startTime = Date.now();

  // Validate params
  const validation = validateParams(ExpandScenarioParamsSchema, params);
  if (!validation.success) {
    return {
      success: false,
      error: `Invalid params:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  const expansionType = validation.data.expansion_type || 'scene';
  const newContent = validation.data.content;

  let updatedContent = scenario.content;

  switch (expansionType) {
    case 'scene':
      // Add a new scene
      updatedContent = scenario.content.trimEnd() + `\n\n### INT./EXT. LOCATION - TIME\n\n${newContent}\n`;
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

  store.updateScenario({ content: updatedContent });

  skillLogger.log({
    skill: 'scenario',
    tool: 'expand_scenario',
    params,
    result: 'success',
    message: `시나리오 "${scenario.name}"에 새로운 내용을 추가했습니다.`,
    duration: Date.now() - startTime,
  });

  return {
    success: true,
    data: { scenarioId: scenario.id },
    message: `시나리오 "${scenario.name}"에 새로운 내용을 추가했습니다.`,
  };
};

/**
 * Condense scenario to core beats
 */
const condenseScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const startTime = Date.now();

  // Validate params
  const validation = validateParams(CondenseScenarioParamsSchema, params);
  if (!validation.success) {
    return {
      success: false,
      error: `Invalid params:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  store.updateScenario({ content: validation.data.content });

  skillLogger.log({
    skill: 'scenario',
    tool: 'condense_scenario',
    params,
    result: 'success',
    message: `시나리오 "${scenario.name}"을(를) 요약했습니다.`,
    duration: Date.now() - startTime,
  });

  return {
    success: true,
    data: { scenarioId: scenario.id },
    message: `시나리오 "${scenario.name}"을(를) 요약했습니다.`,
  };
};

/**
 * Polish scenario for better flow
 */
const polishScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const startTime = Date.now();

  // Validate params
  const validation = validateParams(PolishScenarioParamsSchema, params);
  if (!validation.success) {
    return {
      success: false,
      error: `Invalid params:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  store.updateScenario({ content: validation.data.content });

  skillLogger.log({
    skill: 'scenario',
    tool: 'polish_scenario',
    params,
    result: 'success',
    message: `시나리오 "${scenario.name}"을(를) 다듬었습니다.`,
    duration: Date.now() - startTime,
  });

  return {
    success: true,
    data: { scenarioId: scenario.id },
    message: `시나리오 "${scenario.name}"을(를) 다듬었습니다.`,
  };
};

// Skill definition
const scenarioSkill: Skill = {
  name: 'scenario',
  description: '시나리오 수정, 확장, 축약, 다듬기',
  modes: ['scenario'],
  tools: [
    {
      name: 'edit_scenario',
      description: '시나리오 수정',
      parameters: {
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
        content: { type: 'string', optional: false, description: '축약된 내용' },
      },
    },
    {
      name: 'polish_scenario',
      description: '시나리오 다듬기 (생동감, 페이싱 개선)',
      parameters: {
        content: { type: 'string', optional: false, description: '다듬어진 내용' },
      },
    },
  ],
};

// Register skill with executors
registerSkill(scenarioSkill, {
  edit_scenario: editScenario,
  expand_scenario: expandScenario,
  condense_scenario: condenseScenario,
  polish_scenario: polishScenario,
});

export { scenarioSkill };
