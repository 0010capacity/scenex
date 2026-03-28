// Simplified Scenario type
// Scenario = single markdown document with metadata (no Act/Scene hierarchy)
// Headers (#, ##, ###) are used to visually organize content within the document

export interface Scenario {
  id: string;
  name: string;
  description: string;
  content: string; // Markdown content
  createdAt: string;
  updatedAt: string;
}
