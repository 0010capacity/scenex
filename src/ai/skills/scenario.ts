// ScenarioSkill - Tools for scenario manipulation
// Single scenario per project - provides edit_scenario, expand_scenario, condense_scenario, polish_scenario

import type { Skill, ToolExecutor } from './types';
import { registerSkill } from './registry';
import { useProjectStore } from '@/stores/projectStore';
import type { Scenario } from '@/types/scenario';

/**
 * Edit the project scenario
 */
const editScenario: ToolExecutor<{ scenarioId: string }> = (_ctx, params) => {
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
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

  store.updateScenario(updates);

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
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
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

  store.updateScenario({ content: updatedContent });

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
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  const condensedContent = params.content as string | undefined;

  if (!condensedContent) {
    return { success: false, error: 'No condensed content provided' };
  }

  store.updateScenario({ content: condensedContent });

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
  const store = useProjectStore.getState();

  if (!store.project) {
    return { success: false, error: 'No project loaded' };
  }

  const scenario = store.project.scenario;
  if (!scenario) {
    return { success: false, error: 'No scenario found' };
  }

  const polishedContent = params.content as string | undefined;

  if (!polishedContent) {
    return { success: false, error: 'No polished content provided' };
  }

  store.updateScenario({ content: polishedContent });

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
