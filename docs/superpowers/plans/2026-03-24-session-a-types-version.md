# Session A: Types & Version Tracking

> **For agentic workers:** Execute tasks in order. Use superpowers:subagent-driven-development.

**Goal:** Define new TypeScript types for Scenario/Act hierarchy and add version tracking to Panel.

**Dependencies:** None (this is the foundation)

---

## File Structure

### New Files
- `src/types/scenario.ts` — Scenario, Act types
- `src/types/ai.ts` — AITaskVersion, GenerationMetadata types

### Modified Files
- `src/types/index.ts` — Add PanelVersion, GenerationMetadata to Panel export
- `src/stores/aiStore.ts` — Extended with version tracking, new task types
- `src/stores/projectStore.ts` — Add scenario/act management, version actions

---

## Task 1: Create scenario types

**Files:**
- Create: `src/types/scenario.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/types/scenario.ts

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
  scenes: Scene[];
  order: number;
}

export interface Scene {
  id: string;
  name: string;
  slugline: string;
  description: string;
  scriptLines: ScriptLine[];
  panels: Panel[];
  order: number;
  // Legacy: for flat scene list compatibility
  // When migrating, scenes in Project.scenes[] get wrapped in a default Act
}
```

- [ ] **Step 2: Export from types/index.ts**

Add to `src/types/index.ts`:
```typescript
export * from './scenario';
export * from './ai';
```

---

## Task 2: Create AI version types

**Files:**
- Create: `src/types/ai.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/types/ai.ts

export interface GenerationMetadata {
  promptVersion: string;
  promptTemplate: string;
  model?: string;
  generatedAt: string;
  generationDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface PanelVersion {
  version: number;
  svgData: string | null;
  description: string;
  shotType: string;
  duration: string;
  generationMeta: GenerationMetadata;
  createdAt: string;
}

export interface AITaskVersion {
  id: string;
  panelId: string;
  version: number;
  svgData: string | null;
  description: string;
  generationMeta: GenerationMetadata;
  createdAt: string;
}
```

- [ ] **Step 2: Extend Panel type in types/index.ts**

Find the Panel interface and add:
```typescript
export interface Panel {
  // ... existing fields ...
  version: number;
  parentPanelId?: string;
  generationMeta?: GenerationMetadata;
  versions?: PanelVersion[]; // History stored separately to avoid bloat
}
```

---

## Task 3: Extend aiStore with version tracking

**Files:**
- Modify: `src/stores/aiStore.ts`

- [ ] **Step 1: Add new task types and version fields**

Add to interface:
```typescript
export type AITaskTypeV2 =
  | 'generate_panel'
  | 'batch_generate'
  | 'enhance'
  | 'generate_scenario'
  | 'regenerate_panel'
  | 'compare_versions'
  | 'polish_scenario'
  | 'expand_scenario'
  | 'condense_scenario'
  | 'scenario_to_storyboard'
  | 'script_generation';

export interface AITaskV2 extends AITask {
  type: AITaskTypeV2;
  parentTaskId?: string;
  previousVersionId?: string;
  promptVersion?: string;
  metadata?: {
    scenarioId?: string;
    actId?: string;
    sceneId?: string;
    panelId?: string;
    version?: number;
  };
}
```

- [ ] **Step 2: Add version history actions**

Add to AIState interface:
```typescript
interface AIState {
  tasks: AITaskV2[];
  isProcessing: boolean;
  taskHistory: Map<string, AITaskVersion[]>; // taskId -> versions

  // New actions
  addVersion: (taskId: string, version: AITaskVersion) => void;
  getVersions: (taskId: string) => AITaskVersion[];
  clearTaskHistory: (taskId: string) => void;
}
```

- [ ] **Step 3: Implement new actions**

```typescript
addVersion: (taskId, version) => {
  set((state) => {
    const history = state.taskHistory.get(taskId) || [];
    return {
      taskHistory: new Map(state.taskHistory).set(taskId, [...history, version]),
    };
  });
},

getVersions: (taskId) => {
  return useAIStore.getState().taskHistory.get(taskId) || [];
},

clearTaskHistory: (taskId) => {
  set((state) => {
    const newHistory = new Map(state.taskHistory);
    newHistory.delete(taskId);
    return { taskHistory: newHistory };
  });
},
```

- [ ] **Step 4: Initialize taskHistory Map**

In the store creator:
```typescript
export const useAIStore = create<AIState>((set) => ({
  tasks: [],
  isProcessing: false,
  taskHistory: new Map(),
  // ... existing actions ...
}));
```

---

## Task 4: Extend projectStore with scenario/act management

**Files:**
- Modify: `src/stores/projectStore.ts`

- [ ] **Step 1: Add scenario fields to Project**

Find Project interface, add:
```typescript
export interface Project {
  // ... existing fields ...
  scenarios: Scenario[];
  primaryScenarioId?: string;
}
```

- [ ] **Step 2: Add scenario/act actions**

```typescript
// Add new actions to ProjectStore
addScenario: (name: string) => {
  const id = crypto.randomUUID();
  const scenario: Scenario = {
    id,
    name,
    description: '',
    acts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  set((state) => ({
    project: state.project
      ? { ...state.project, scenarios: [...state.project.scenarios, scenario] }
      : null,
    isDirty: true,
  }));
  return id;
},

updateScenario: (id: string, updates: Partial<Scenario>) => {
  set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        scenarios: state.project.scenarios.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        ),
      },
      isDirty: true,
    };
  });
},

deleteScenario: (id: string) => {
  set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        scenarios: state.project.scenarios.filter((s) => s.id !== id),
      },
      isDirty: true,
    };
  });
},

addAct: (scenarioId: string, name: string) => {
  const id = crypto.randomUUID();
  const act: Act = {
    id,
    name,
    synopsis: '',
    scenes: [],
    order: 0,
  };
  set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        scenarios: state.project.scenarios.map((s) =>
          s.id === scenarioId
            ? { ...s, acts: [...s.acts, act], updatedAt: new Date().toISOString() }
            : s
        ),
      },
      isDirty: true,
    };
  });
  return id;
},
```

- [ ] **Step 3: Add version-aware panel actions**

```typescript
updatePanelVersion: (sceneId: string, panelId: string, updates: Partial<Panel>) => {
  set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        scenes: state.project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                panels: scene.panels.map((panel) =>
                  panel.id === panelId
                    ? {
                        ...panel,
                        ...updates,
                        version: panel.version + 1,
                        parentPanelId: panel.parentPanelId || panel.id,
                        updatedAt: new Date().toISOString(),
                      }
                    : panel
                ),
              }
            : scene
        ),
      },
      isDirty: true,
    };
  });
},

getPanelVersions: (sceneId: string, panelId: string): PanelVersion[] => {
  const state = useProjectStore.getState();
  // This would retrieve version history - implement based on where you store it
  return [];
},

restorePanelVersion: (sceneId: string, panelId: string, version: number) => {
  // Restore a specific version
  const versions = useProjectStore.getState().getPanelVersions(sceneId, panelId);
  const targetVersion = versions.find((v) => v.version === version);
  if (targetVersion) {
    useProjectStore.getState().updatePanel(sceneId, panelId, {
      svgData: targetVersion.svgData,
      description: targetVersion.description,
      shotType: targetVersion.shotType,
      duration: targetVersion.duration,
    });
  }
},
```

---

## Task 5: Commit

```bash
git add src/types/scenario.ts src/types/ai.ts src/types/index.ts src/stores/aiStore.ts src/stores/projectStore.ts
git commit -m "feat(scenario): add Scenario/Act types and version tracking types

- Add Scenario, Act, Scene types
- Add GenerationMetadata, PanelVersion, AITaskVersion types
- Extend Panel with version and parentPanelId fields
- Extend aiStore with taskHistory Map and version tracking actions
- Extend projectStore with scenario/act management actions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
