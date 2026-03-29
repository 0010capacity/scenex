// SceneX Data Types
// Note: Scenario is a simplified single-markdown document type (no hierarchy)
// Flat project types (Scene, Panel, ScriptLine) are defined here for project.scenes compatibility

export type * from './ai';
export type { Scenario } from './scenario';

// Also export the interface types from ai for implementation
export type { GenerationMetadata, PanelVersion, AITaskVersion } from './ai';

// Constants
import { DEFAULT_PANEL_DURATION } from '@/constants';

// Shot types for storyboard panels
export type ShotType = 'EWS' | 'WS' | 'MS' | 'CU' | 'ECU' | 'OTS' | 'POV';
export type CameraMovement = 'Static' | 'Pan' | 'Tilt' | 'Dolly' | 'Pullback';
export type MoodTag = 'emotional' | 'golden' | 'tension' | 'humor' | 'excitement' | 'sadness';
export type Transition = 'cut' | 'fadein' | 'fadeout' | 'dissolve';
export type SourceType = 'ai' | 'manual' | 'imported' | 'empty';
export type ScriptLineType = 'slugline' | 'action' | 'character' | 'paren' | 'dialogue';

// Import types needed for the file
import type { GenerationMetadata } from './ai';
import type { Scenario } from './scenario';

// Flat scene type for project.scenes (storyboard-level scenes)
export interface ScriptLine {
  id: string;
  type: ScriptLineType;
  text: string;
  character?: string;
}

export interface Panel {
  id: string;
  number: number;
  shotType: ShotType | null;
  duration: string;
  cameraMovement: CameraMovement | null;
  description: string;
  dialogue: string;
  sound: string;
  moodTags: MoodTag[];
  transition: Transition;
  imageData: string | null; // base64 encoded for preview
  imagePath: string | null; // relative path in assets folder
  svgData: string | null;
  sourceType: SourceType;
  version: number;
  parentPanelId?: string;
  generationMeta?: GenerationMetadata;
}

export interface Scene {
  id: string;
  name: string;
  slugline: string;
  description: string;
  scriptLines: ScriptLine[];
  panels: Panel[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scenario: Scenario; // Single scenario per project
}

export const SHOT_TYPE_OPTIONS: { value: ShotType; label: string; description: string }[] = [
  { value: 'EWS', label: 'EWS', description: 'Extreme Wide Shot' },
  { value: 'WS', label: 'WS', description: 'Wide Shot' },
  { value: 'MS', label: 'MS', description: 'Medium Shot' },
  { value: 'CU', label: 'CU', description: 'Close Up' },
  { value: 'ECU', label: 'ECU', description: 'Extreme Close Up' },
  { value: 'OTS', label: 'OTS', description: 'Over The Shoulder' },
  { value: 'POV', label: 'POV', description: 'Point of View' },
];

export const CAMERA_MOVEMENT_OPTIONS: { value: CameraMovement; label: string }[] = [
  { value: 'Static', label: 'Static' },
  { value: 'Pan', label: 'Pan' },
  { value: 'Tilt', label: 'Tilt' },
  { value: 'Dolly', label: 'Dolly' },
  { value: 'Pullback', label: 'Pullback' },
];

export const MOOD_TAG_OPTIONS: { value: MoodTag; label: string; labelKo: string; color: string }[] = [
  { value: 'emotional', label: 'Emotional', labelKo: '감성적', color: '#E8A838' },
  { value: 'golden', label: 'Golden', labelKo: '황금빛', color: '#FFB347' },
  { value: 'tension', label: 'Tension', labelKo: '긴장감', color: '#FF6B6B' },
  { value: 'humor', label: 'Humor', labelKo: '유머', color: '#4ECDC4' },
  { value: 'excitement', label: 'Excitement', labelKo: '설렘', color: '#45B7D1' },
  { value: 'sadness', label: 'Sadness', labelKo: '슬픔', color: '#6C7B95' },
];

// Derived helper for Korean labels (for InspectorPanel)
export const MOOD_LABELS: Record<MoodTag, string> = MOOD_TAG_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.value]: opt.labelKo }),
  {} as Record<MoodTag, string>
);

export const TRANSITION_OPTIONS: { value: Transition; label: string }[] = [
  { value: 'cut', label: 'Cut' },
  { value: 'fadein', label: 'Fade In' },
  { value: 'fadeout', label: 'Fade Out' },
  { value: 'dissolve', label: 'Dissolve' },
];

export function createEmptyPanel(number: number): Panel {
  return {
    id: crypto.randomUUID(),
    number,
    shotType: null,
    duration: DEFAULT_PANEL_DURATION,
    cameraMovement: null,
    description: '',
    dialogue: '',
    sound: '',
    moodTags: [],
    transition: 'cut',
    imageData: null,
    imagePath: null,
    svgData: null,
    sourceType: 'empty',
    version: 1,
  };
}

export function createEmptyScene(name: string = 'Scene 1'): Scene {
  return {
    id: crypto.randomUUID(),
    name,
    slugline: 'INT. LOCATION — DAY',
    description: '',
    scriptLines: [],
    panels: [],
  };
}

export function createEmptyProject(name: string = 'Untitled Project'): Project {
  const now = new Date().toISOString();
  const scenarioId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    scenario: {
      id: scenarioId,
      name: name || '시나리오',
      description: '',
      content: `# ${name || '시나리오'}\n\n## Act 1\n\n### INT. LOCATION - TIME\n`,
      scenes: [createEmptyScene()],
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Migrate legacy project (with project.scenes and project.scenarios) to new format
 * Creates a single scenario from the first scenario or creates a default one
 */
export function migrateProject(project: Project & { scenes?: Scene[]; scenarios?: Scenario[]; primaryScenarioId?: string }): Project {
  // Already migrated (has scenario with scenes)
  if (project.scenario?.scenes) {
    return project;
  }

  // Legacy migration
  const now = new Date().toISOString();
  const scenarioId = project.primaryScenarioId || project.scenarios?.[0]?.id || crypto.randomUUID();
  const legacyScenario = project.scenarios?.find(s => s.id === scenarioId);

  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: now,
    scenario: {
      id: scenarioId,
      name: legacyScenario?.name || project.name || '시나리오',
      description: legacyScenario?.description || '',
      content: legacyScenario?.content || `# ${project.name || '시나리오'}\n\n`,
      scenes: project.scenes || [createEmptyScene()],
      createdAt: legacyScenario?.createdAt || now,
      updatedAt: now,
    },
  };
}
