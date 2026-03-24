// Scenario, Act hierarchy types (for Session D)
// These types are for the hierarchical scenario structure:
// Project.scenarios[] -> Scenario -> Act[] -> ScenarioScene[] -> Panel[]

import type { GenerationMetadata, PanelVersion, AITaskVersion } from './ai';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  acts: Act[];
  createdAt: string;
  updatedAt: string;
}

export interface Act {
  id: string;
  name: string;
  synopsis: string;
  scenes: ScenarioScene[];
  order: number;
}

// ScenarioScene has an order field, unlike the flat Scene type
export interface ScenarioScene {
  id: string;
  name: string;
  slugline: string;
  description: string;
  scriptLines: ScriptLine[];
  panels: Panel[];
  order: number;
}

export interface ScriptLine {
  id: string;
  type: 'slugline' | 'action' | 'character' | 'paren' | 'dialogue';
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
  imageData: string | null;
  svgData: string | null;
  sourceType: SourceType;
  version: number;
  parentPanelId?: string;
  generationMeta?: GenerationMetadata;
}

export type ShotType = 'EWS' | 'WS' | 'MS' | 'CU' | 'ECU' | 'OTS' | 'POV';
export type CameraMovement = 'Static' | 'Pan' | 'Tilt' | 'Dolly' | 'Pullback';
export type MoodTag = 'emotional' | 'golden' | 'tension' | 'humor' | 'excitement' | 'sadness';
export type Transition = 'cut' | 'fadein' | 'fadeout' | 'dissolve';
export type SourceType = 'ai' | 'manual' | 'imported' | 'empty';

// Re-export AI types
export type { GenerationMetadata, PanelVersion, AITaskVersion };
