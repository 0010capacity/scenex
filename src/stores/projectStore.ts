import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Project,
  Scene,
  Panel,
  ScriptLine,
  createEmptyProject,
  createEmptyScene,
  createEmptyPanel,
  migrateProject,
} from '@/types';
import { Scenario } from '@/types/scenario';
import { invokeWrapper } from '@/utils/invokeWrapper';
import type { PanelVersion } from '@/types/ai';

interface ProjectState {
  project: Project | null;
  selectedSceneId: string | null;
  selectedPanelId: string | null;
  isDirty: boolean;

  // Project actions
  newProject: (name?: string) => void;
  loadProject: (project: Project) => void;
  updateProject: (updates: Partial<Project>) => void;

  // Scene actions
  addScene: (name?: string) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;

  // Panel actions
  addPanel: (sceneId: string, panel?: Partial<Panel>) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  deletePanel: (panelId: string) => void;
  movePanel: (panelId: string, toSceneId: string) => void;
  reorderPanels: (sceneId: string, fromIndex: number, toIndex: number) => void;
  updatePanelVersion: (sceneId: string, panelId: string, updates: Partial<Panel>) => void;
  restorePanelVersion: (sceneId: string, panelId: string, version: number, versions: PanelVersion[]) => void;

  // Script line actions
  updateScriptLine: (sceneId: string, lineId: string, updates: Partial<ScriptLine>) => void;
  deleteScriptLine: (sceneId: string, lineId: string) => void;
  reorderScriptLines: (sceneId: string, fromIndex: number, toIndex: number) => void;

  // Scenario actions
  updateScenario: (updates: Partial<Scenario>) => void;

  // Selection
  selectScene: (sceneId: string | null) => void;
  selectPanel: (panelId: string | null) => void;

  // Utility
  getSelectedScene: () => Scene | null;
  getSelectedPanel: () => Panel | null;
  markClean: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: null,
      selectedSceneId: null,
      selectedPanelId: null,
      isDirty: false,

      newProject: (name) => {
        const project = createEmptyProject(name);
        set({
          project,
          selectedSceneId: project.scenario.scenes[0]?.id ?? null,
          selectedPanelId: null,
          isDirty: false,
        });
      },

      loadProject: (project) => {
        // Apply migration if needed
        const migratedProject = migrateProject(project);
        set({
          project: migratedProject,
          selectedSceneId: migratedProject.scenario.scenes[0]?.id ?? null,
          selectedPanelId: null,
          isDirty: false,
        });
      },

      updateProject: (updates) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, ...updates, updatedAt: new Date().toISOString() }
            : null,
          isDirty: true,
        }));
      },

      addScene: (name) => {
        const state = get();
        if (!state.project) return;

        const sceneNumber = state.project.scenario.scenes.length + 1;
        const newScene = createEmptyScene(name ?? `Scene ${sceneNumber}`);

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                scenario: {
                  ...state.project.scenario,
                  scenes: [...state.project.scenario.scenes, newScene],
                  updatedAt: new Date().toISOString(),
                },
              }
            : null,
          selectedSceneId: newScene.id,
          isDirty: true,
        }));

        // Generate script lines in background (non-blocking)
        invokeWrapper<{
          script_lines: Array<{
            line_type: string;
            text: string;
            character: string | null;
          }>;
          success: boolean;
        }>('generate_script_lines', { request: { slugline: newScene.slugline } })
          .then((response) => {
            if (response && response.success && response.script_lines) {
            const scriptLines = response.script_lines.map((line) => ({
              id: crypto.randomUUID(),
              type: line.line_type as ScriptLine['type'],
              text: line.text,
              character: line.character ?? undefined,
            }));
            get().updateScene(newScene.id, { scriptLines });
          }
        })
          .catch((e) => {
            console.warn('Failed to generate script lines:', e);
          });
      },

      updateScene: (sceneId, updates) => {
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                scenario: {
                  ...state.project.scenario,
                  scenes: state.project.scenario.scenes.map((s) =>
                    s.id === sceneId ? { ...s, ...updates } : s
                  ),
                  updatedAt: new Date().toISOString(),
                },
              }
            : null,
          isDirty: true,
        }));
      },

      deleteScene: (sceneId) => {
        set((state) => {
          if (!state.project) return state;
          if (state.project.scenario.scenes.length <= 1) return state; // Keep at least one scene

          const newScenes = state.project.scenario.scenes.filter((s) => s.id !== sceneId);
          const newSelectedSceneId =
            state.selectedSceneId === sceneId
              ? newScenes[0]?.id ?? null
              : state.selectedSceneId;

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: newScenes,
                updatedAt: new Date().toISOString(),
              },
            },
            selectedSceneId: newSelectedSceneId,
            selectedPanelId: null,
            isDirty: true,
          };
        });
      },

      reorderScenes: (fromIndex, toIndex) => {
        set((state) => {
          if (!state.project) return state;

          const scenes = [...state.project.scenario.scenes];
          const [removed] = scenes.splice(fromIndex, 1);
          scenes.splice(toIndex, 0, removed);

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes,
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      addPanel: (sceneId, panelData) => {
        set((state) => {
          if (!state.project) return state;

          const scene = state.project.scenario.scenes.find((s) => s.id === sceneId);
          if (!scene) return state;

          const panelNumber = scene.panels.length + 1;
          const newPanel = { ...createEmptyPanel(panelNumber), ...panelData };

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: state.project.scenario.scenes.map((s) =>
                  s.id === sceneId
                    ? { ...s, panels: [...s.panels, newPanel] }
                    : s
                ),
                updatedAt: new Date().toISOString(),
              },
            },
            selectedPanelId: newPanel.id,
            isDirty: true,
          };
        });
      },

      updatePanel: (panelId, updates) => {
        set((state) => {
          if (!state.project) return state;

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: state.project.scenario.scenes.map((s) => ({
                  ...s,
                  panels: s.panels.map((p) =>
                    p.id === panelId ? { ...p, ...updates } : p
                  ),
                })),
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      deletePanel: (panelId) => {
        set((state) => {
          if (!state.project) return state;

          let newSelectedPanelId = state.selectedPanelId;

          const newScenes = state.project.scenario.scenes.map((s) => {
            const filteredPanels = s.panels.filter((p) => p.id !== panelId);
            // Renumber panels
            const renumberedPanels = filteredPanels.map((p, i) => ({
              ...p,
              number: i + 1,
            }));
            return { ...s, panels: renumberedPanels };
          });

          // If deleted panel was selected, clear selection
          if (state.selectedPanelId === panelId) {
            newSelectedPanelId = null;
          }

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: newScenes,
                updatedAt: new Date().toISOString(),
              },
            },
            selectedPanelId: newSelectedPanelId,
            isDirty: true,
          };
        });
      },

      movePanel: (panelId, toSceneId) => {
        set((state) => {
          if (!state.project) return state;

          let movedPanel: Panel | null = null;

          // Find and remove panel from source scene
          const scenesWithoutPanel = state.project.scenario.scenes.map((s) => {
            const panel = s.panels.find((p) => p.id === panelId);
            if (panel) {
              movedPanel = panel;
              return { ...s, panels: s.panels.filter((p) => p.id !== panelId) };
            }
            return s;
          });

          if (!movedPanel) return state;

          // Add panel to target scene
          const scenesWithPanel = scenesWithoutPanel.map((s) => {
            if (s.id === toSceneId) {
              return {
                ...s,
                panels: [...s.panels, { ...movedPanel!, number: s.panels.length + 1 }],
              };
            }
            return s;
          });

          // Renumber all panels
          const renumberedScenes = scenesWithPanel.map((s) => ({
            ...s,
            panels: s.panels.map((p, i) => ({ ...p, number: i + 1 })),
          }));

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: renumberedScenes,
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      reorderPanels: (sceneId, fromIndex, toIndex) => {
        set((state) => {
          if (!state.project) return state;

          const newScenes = state.project.scenario.scenes.map((s) => {
            if (s.id !== sceneId) return s;

            const panels = [...s.panels];
            const [removed] = panels.splice(fromIndex, 1);
            panels.splice(toIndex, 0, removed);

            // Renumber
            const renumberedPanels = panels.map((p, i) => ({ ...p, number: i + 1 }));

            return { ...s, panels: renumberedPanels };
          });

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: newScenes,
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      updateScriptLine: (sceneId, lineId, updates) => {
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                scenario: {
                  ...state.project.scenario,
                  scenes: state.project.scenario.scenes.map((s) =>
                    s.id === sceneId
                      ? {
                          ...s,
                          scriptLines: s.scriptLines.map((l) =>
                            l.id === lineId ? { ...l, ...updates } : l
                          ),
                        }
                      : s
                  ),
                  updatedAt: new Date().toISOString(),
                },
              }
            : null,
          isDirty: true,
        }));
      },

      deleteScriptLine: (sceneId, lineId) => {
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                scenario: {
                  ...state.project.scenario,
                  scenes: state.project.scenario.scenes.map((s) =>
                    s.id === sceneId
                      ? { ...s, scriptLines: s.scriptLines.filter((l) => l.id !== lineId) }
                      : s
                  ),
                  updatedAt: new Date().toISOString(),
                },
              }
            : null,
          isDirty: true,
        }));
      },

      reorderScriptLines: (sceneId, fromIndex, toIndex) => {
        set((state) => {
          if (!state.project) return state;

          const newScenes = state.project.scenario.scenes.map((s) => {
            if (s.id !== sceneId) return s;

            const lines = [...s.scriptLines];
            const [removed] = lines.splice(fromIndex, 1);
            lines.splice(toIndex, 0, removed);

            return { ...s, scriptLines: lines };
          });

          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: newScenes,
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      // Scenario actions
      updateScenario: (updates) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
            isDirty: true,
          };
        });
      },

      updatePanelVersion: (sceneId, panelId, updates) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: {
              ...state.project,
              scenario: {
                ...state.project.scenario,
                scenes: state.project.scenario.scenes.map((scene) =>
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
                              }
                            : panel
                        ),
                      }
                    : scene
                ),
              },
            },
            isDirty: true,
          };
        });
      },

      restorePanelVersion: (sceneId, panelId, version, versions) => {
        const targetVersion = versions.find((v) => v.version === version);
        if (targetVersion) {
          get().updatePanelVersion(sceneId, panelId, {
            svgData: targetVersion.svgData,
            description: targetVersion.description,
            shotType: targetVersion.shotType as Panel['shotType'],
            duration: targetVersion.duration,
          });
        }
      },

      selectScene: (sceneId) => {
        set({ selectedSceneId: sceneId, selectedPanelId: null });
      },

      selectPanel: (panelId) => {
        set((state) => {
          // Also select the scene containing this panel
          if (panelId && state.project) {
            for (const scene of state.project.scenario.scenes) {
              if (scene.panels.some((p) => p.id === panelId)) {
                return { selectedSceneId: scene.id, selectedPanelId: panelId };
              }
            }
          }
          return { selectedPanelId: panelId };
        });
      },

      getSelectedScene: () => {
        const state = get();
        if (!state.project || !state.selectedSceneId) return null;
        return state.project.scenario.scenes.find((s) => s.id === state.selectedSceneId) ?? null;
      },

      getSelectedPanel: () => {
        const state = get();
        if (!state.project) return null;

        for (const scene of state.project.scenario.scenes) {
          const panel = scene.panels.find((p) => p.id === state.selectedPanelId);
          if (panel) return panel;
        }
        return null;
      },

      markClean: () => {
        set({ isDirty: false });
      },
    }),
    {
      name: 'scenex-project',
      partialize: (state) => ({
        selectedSceneId: state.selectedSceneId,
      }),
    }
  )
);
