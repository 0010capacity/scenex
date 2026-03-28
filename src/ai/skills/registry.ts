// Skills Registry
// Central registry for all skills in the system

import type { Skill, RegisteredSkill, EditorMode, SkillContext, SkillResult, ToolExecutor } from './types';

/**
 * Global skills registry
 */
class SkillsRegistry {
  private skills: Map<string, RegisteredSkill> = new Map();

  /**
   * Register a skill with its executors
   */
  register(
    skill: Skill,
    executors: Record<string, ToolExecutor>
  ): void {
    // Validate all tools have executors
    for (const tool of skill.tools) {
      if (!executors[tool.name]) {
        console.warn(`Skill "${skill.name}" tool "${tool.name}" has no executor`);
      }
    }

    this.skills.set(skill.name, {
      ...skill,
      executors,
    });
  }

  /**
   * Get all registered skills
   */
  getAll(): RegisteredSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills available for a specific editor mode
   */
  getAvailableSkills(mode: EditorMode): RegisteredSkill[] {
    return this.getAll().filter(skill => skill.modes.includes(mode));
  }

  /**
   * Get a specific skill by name
   */
  getSkill(name: string): RegisteredSkill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get skill definitions for AI context (without executors)
   */
  getSkillDefinitions(mode: EditorMode): Skill[] {
    return this.getAvailableSkills(mode).map(({ executors: _, ...skill }) => skill);
  }

  /**
   * Execute a tool call
   */
  async execute(
    skillName: string,
    toolName: string,
    context: SkillContext,
    params: Record<string, unknown>
  ): Promise<SkillResult> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return {
        success: false,
        error: `Unknown skill: ${skillName}`,
      };
    }

    const executor = skill.executors[toolName];
    if (!executor) {
      return {
        success: false,
        error: `Unknown tool: ${skillName}.${toolName}`,
      };
    }

    try {
      const result = await executor(context, params);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute multiple skill calls in sequence
   */
  async executeAll(
    skillCalls: Array<{ skill: string; tool: string; parameters: Record<string, unknown> }>,
    context: SkillContext
  ): Promise<SkillResult[]> {
    const results: SkillResult[] = [];

    for (const call of skillCalls) {
      const result = await this.execute(call.skill, call.tool, context, call.parameters);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }
}

// Singleton instance
export const skillsRegistry = new SkillsRegistry();

/**
 * Helper function to register a skill
 */
export function registerSkill(
  skill: Skill,
  executors: Record<string, ToolExecutor>
): void {
  skillsRegistry.register(skill, executors);
}

/**
 * Get available skills for a mode
 */
export function getAvailableSkills(mode: EditorMode): RegisteredSkill[] {
  return skillsRegistry.getAvailableSkills(mode);
}

/**
 * Get skill definitions for AI context
 */
export function getSkillDefinitions(mode: EditorMode): Skill[] {
  return skillsRegistry.getSkillDefinitions(mode);
}

/**
 * Execute a tool call
 */
export async function executeSkill(
  skillName: string,
  toolName: string,
  context: SkillContext,
  params: Record<string, unknown>
): Promise<SkillResult> {
  return skillsRegistry.execute(skillName, toolName, context, params);
}
