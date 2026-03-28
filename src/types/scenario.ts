// Scenario type - single markdown document with scenes (storyboard)
// Headers (#, ##, ###) are used to visually organize content within the document

import type { Scene } from '@/types';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  content: string; // Markdown content
  scenes: Scene[]; // Storyboard scenes belonging to this scenario
  createdAt: string;
  updatedAt: string;
}
