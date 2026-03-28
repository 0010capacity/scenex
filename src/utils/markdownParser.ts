import type { Scenario } from '@/types/scenario';

/**
 * Creates an empty scenario with default content
 */
export function createEmptyScenario(name: string = '새 시나리오'): Scenario {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    content: `# ${name}\n\n## Act 1\n\n### Scene 1\n`,
    scenes: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Counts headings in markdown content
 */
export function countMarkdownSections(content: string): { acts: number; scenes: number } {
  const lines = content.split('\n');
  let acts = 0;
  let scenes = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) acts++;
    if (line.startsWith('### ')) scenes++;
  }

  return { acts, scenes };
}

/**
 * Extracts title from markdown content (first # heading)
 */
export function extractTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}
