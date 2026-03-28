import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../projectStore';
import { createEmptyProject, createEmptyPanel } from '@/types';

// Mock the invokeWrapper to prevent Tauri calls during tests
vi.mock('@/utils/invokeWrapper', () => ({
  invokeWrapper: vi.fn().mockResolvedValue({ success: false }),
}));

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProjectStore.setState({
      project: null,
      selectedSceneId: null,
      selectedPanelId: null,
      selectedScenarioId: null,
      isDirty: false,
    });
  });

  describe('newProject', () => {
    it('should create new project with default name', () => {
      useProjectStore.getState().newProject();

      const project = useProjectStore.getState().project;
      expect(project).toBeDefined();
      expect(project!.name).toBe('Untitled Project');
      expect(project!.scenes).toHaveLength(1);
    });

    it('should create new project with custom name', () => {
      useProjectStore.getState().newProject('My Movie');

      const project = useProjectStore.getState().project;
      expect(project!.name).toBe('My Movie');
    });

    it('should auto-select first scene', () => {
      useProjectStore.getState().newProject('Test');

      const project = useProjectStore.getState().project;
      expect(useProjectStore.getState().selectedSceneId).toBe(project!.scenes[0].id);
    });

    it('should clear panel selection', () => {
      useProjectStore.getState().newProject('Test');

      expect(useProjectStore.getState().selectedPanelId).toBeNull();
    });

    it('should set isDirty to false', () => {
      useProjectStore.getState().newProject('Test');

      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe('loadProject', () => {
    it('should load an existing project', () => {
      const project = createEmptyProject('Loaded Project');
      useProjectStore.getState().loadProject(project);

      expect(useProjectStore.getState().project).toEqual(project);
    });

    it('should auto-select first scene', () => {
      const project = createEmptyProject('Test');
      useProjectStore.getState().loadProject(project);

      expect(useProjectStore.getState().selectedSceneId).toBe(project.scenes[0].id);
    });

    it('should clear panel selection', () => {
      const project = createEmptyProject('Test');
      useProjectStore.getState().loadProject(project);

      expect(useProjectStore.getState().selectedPanelId).toBeNull();
    });

    it('should set isDirty to false', () => {
      const project = createEmptyProject('Test');
      useProjectStore.getState().loadProject(project);

      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe('updateProject', () => {
    it('should update project name', () => {
      useProjectStore.getState().newProject('Original');
      useProjectStore.getState().updateProject({ name: 'Updated' });

      expect(useProjectStore.getState().project!.name).toBe('Updated');
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().updateProject({ name: 'Updated' });

      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('should update updatedAt timestamp', async () => {
      useProjectStore.getState().newProject('Test');
      const originalUpdatedAt = useProjectStore.getState().project!.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 10));
      useProjectStore.getState().updateProject({ name: 'Updated' });
      const newUpdatedAt = useProjectStore.getState().project!.updatedAt;

      expect(newUpdatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('addScene', () => {
    it('should add a new scene', () => {
      useProjectStore.getState().newProject('Test');
      const initialCount = useProjectStore.getState().project!.scenes.length;

      useProjectStore.getState().addScene('New Scene');

      expect(useProjectStore.getState().project!.scenes).toHaveLength(initialCount + 1);
    });

    it('should auto-select the new scene', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('New Scene');

      const newScene = useProjectStore.getState().project!.scenes[1];
      expect(useProjectStore.getState().selectedSceneId).toBe(newScene.id);
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('New Scene');

      expect(useProjectStore.getState().isDirty).toBe(true);
    });
  });

  describe('updateScene', () => {
    it('should update scene name', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;

      useProjectStore.getState().updateScene(sceneId, { name: 'Updated Scene' });

      const scene = useProjectStore.getState().project!.scenes[0];
      expect(scene.name).toBe('Updated Scene');
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().markClean();

      useProjectStore.getState().updateScene(sceneId, { name: 'Updated' });

      expect(useProjectStore.getState().isDirty).toBe(true);
    });
  });

  describe('deleteScene', () => {
    it('should delete a scene', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      const sceneToDelete = useProjectStore.getState().project!.scenes[1].id;

      useProjectStore.getState().deleteScene(sceneToDelete);

      expect(useProjectStore.getState().project!.scenes).toHaveLength(1);
    });

    it('should not delete if only one scene exists', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;

      useProjectStore.getState().deleteScene(sceneId);

      expect(useProjectStore.getState().project!.scenes).toHaveLength(1);
    });

    it('should re-select first scene if deleted scene was selected', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      const sceneToDelete = useProjectStore.getState().project!.scenes[1].id;

      useProjectStore.getState().deleteScene(sceneToDelete);

      const firstSceneId = useProjectStore.getState().project!.scenes[0].id;
      expect(useProjectStore.getState().selectedSceneId).toBe(firstSceneId);
    });

    it('should clear panel selection', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      const sceneToDelete = useProjectStore.getState().project!.scenes[1].id;

      useProjectStore.getState().deleteScene(sceneToDelete);

      expect(useProjectStore.getState().selectedPanelId).toBeNull();
    });
  });

  describe('selectScene', () => {
    it('should select a scene', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      const sceneId = useProjectStore.getState().project!.scenes[1].id;

      useProjectStore.getState().selectScene(sceneId);

      expect(useProjectStore.getState().selectedSceneId).toBe(sceneId);
    });

    it('should clear panel selection', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      const panel = createEmptyPanel(1);
      useProjectStore.getState().addPanel(sceneId, panel);
      useProjectStore.getState().selectPanel(panel.id);

      useProjectStore.getState().selectScene(sceneId);

      expect(useProjectStore.getState().selectedPanelId).toBeNull();
    });
  });

  describe('selectPanel', () => {
    it('should select a panel', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      const panel = createEmptyPanel(1);
      useProjectStore.getState().addPanel(sceneId, panel);

      useProjectStore.getState().selectPanel(panel.id);

      expect(useProjectStore.getState().selectedPanelId).toBe(panel.id);
    });

    it('should auto-select the scene containing the panel', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      const scene2Id = useProjectStore.getState().project!.scenes[1].id;
      const panel = createEmptyPanel(1);
      useProjectStore.getState().addPanel(scene2Id, panel);

      // First select scene 1
      useProjectStore.getState().selectScene(useProjectStore.getState().project!.scenes[0].id);

      // Then select panel in scene 2
      useProjectStore.getState().selectPanel(panel.id);

      expect(useProjectStore.getState().selectedSceneId).toBe(scene2Id);
    });
  });

  describe('addPanel', () => {
    it('should add a panel to a scene', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;

      useProjectStore.getState().addPanel(sceneId);

      const scene = useProjectStore.getState().project!.scenes[0];
      expect(scene.panels).toHaveLength(1);
    });

    it('should auto-select the new panel', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;

      useProjectStore.getState().addPanel(sceneId);

      const panel = useProjectStore.getState().project!.scenes[0].panels[0];
      expect(useProjectStore.getState().selectedPanelId).toBe(panel.id);
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().markClean();

      useProjectStore.getState().addPanel(sceneId);

      expect(useProjectStore.getState().isDirty).toBe(true);
    });
  });

  describe('updatePanel', () => {
    it('should update panel properties', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;

      useProjectStore.getState().updatePanel(panelId, { description: 'New description' });

      const panel = useProjectStore.getState().project!.scenes[0].panels[0];
      expect(panel.description).toBe('New description');
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;
      useProjectStore.getState().markClean();

      useProjectStore.getState().updatePanel(panelId, { description: 'Updated' });

      expect(useProjectStore.getState().isDirty).toBe(true);
    });
  });

  describe('deletePanel', () => {
    it('should delete a panel', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;

      useProjectStore.getState().deletePanel(panelId);

      const scene = useProjectStore.getState().project!.scenes[0];
      expect(scene.panels).toHaveLength(0);
    });

    it('should clear selection if deleted panel was selected', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;
      useProjectStore.getState().selectPanel(panelId);

      useProjectStore.getState().deletePanel(panelId);

      expect(useProjectStore.getState().selectedPanelId).toBeNull();
    });

    it('should renumber remaining panels', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      useProjectStore.getState().addPanel(sceneId);
      useProjectStore.getState().addPanel(sceneId);

      // Delete the first panel (number 1)
      const firstPanelId = useProjectStore.getState().project!.scenes[0].panels[0].id;
      useProjectStore.getState().deletePanel(firstPanelId);

      const scene = useProjectStore.getState().project!.scenes[0];
      expect(scene.panels[0].number).toBe(1);
      expect(scene.panels[1].number).toBe(2);
    });
  });

  describe('getSelectedScene', () => {
    it('should return null when no project', () => {
      expect(useProjectStore.getState().getSelectedScene()).toBeNull();
    });

    it('should return null when no scene selected', () => {
      useProjectStore.getState().newProject('Test');
      // Clear scene selection by using the store's internal setState
      useProjectStore.setState({ selectedSceneId: null });

      expect(useProjectStore.getState().getSelectedScene()).toBeNull();
    });

    it('should return the selected scene', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;

      const scene = useProjectStore.getState().getSelectedScene();

      expect(scene).toBeDefined();
      expect(scene!.id).toBe(sceneId);
    });
  });

  describe('getSelectedPanel', () => {
    it('should return null when no project', () => {
      expect(useProjectStore.getState().getSelectedPanel()).toBeNull();
    });

    it('should return null when no panel selected', () => {
      useProjectStore.getState().newProject('Test');

      expect(useProjectStore.getState().getSelectedPanel()).toBeNull();
    });

    it('should return the selected panel', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;
      useProjectStore.getState().selectPanel(panelId);

      const panel = useProjectStore.getState().getSelectedPanel();

      expect(panel).toBeDefined();
      expect(panel!.id).toBe(panelId);
    });
  });

  describe('markClean', () => {
    it('should set isDirty to false', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().updateProject({ name: 'Updated' });
      expect(useProjectStore.getState().isDirty).toBe(true);

      useProjectStore.getState().markClean();

      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe('reorderScenes', () => {
    it('should reorder scenes', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      useProjectStore.getState().addScene('Scene 3');

      const scenes = useProjectStore.getState().project!.scenes;
      const firstId = scenes[0].id;
      const secondId = scenes[1].id;
      const thirdId = scenes[2].id;

      // Move first scene to last position
      useProjectStore.getState().reorderScenes(0, 2);

      const reordered = useProjectStore.getState().project!.scenes;
      expect(reordered[0].id).toBe(secondId);
      expect(reordered[1].id).toBe(thirdId);
      expect(reordered[2].id).toBe(firstId);
    });

    it('should set isDirty to true', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');
      useProjectStore.getState().markClean();

      useProjectStore.getState().reorderScenes(0, 1);

      expect(useProjectStore.getState().isDirty).toBe(true);
    });
  });

  describe('reorderPanels', () => {
    it('should reorder panels within a scene', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId, { description: 'Panel 1' });
      useProjectStore.getState().addPanel(sceneId, { description: 'Panel 2' });
      useProjectStore.getState().addPanel(sceneId, { description: 'Panel 3' });

      // Move first panel to last position
      useProjectStore.getState().reorderPanels(sceneId, 0, 2);

      const panels = useProjectStore.getState().project!.scenes[0].panels;
      expect(panels[0].description).toBe('Panel 2');
      expect(panels[1].description).toBe('Panel 3');
      expect(panels[2].description).toBe('Panel 1');
    });

    it('should renumber panels after reorder', () => {
      useProjectStore.getState().newProject('Test');
      const sceneId = useProjectStore.getState().project!.scenes[0].id;
      useProjectStore.getState().addPanel(sceneId);
      useProjectStore.getState().addPanel(sceneId);
      useProjectStore.getState().addPanel(sceneId);

      useProjectStore.getState().reorderPanels(sceneId, 0, 2);

      const panels = useProjectStore.getState().project!.scenes[0].panels;
      expect(panels[0].number).toBe(1);
      expect(panels[1].number).toBe(2);
      expect(panels[2].number).toBe(3);
    });
  });

  describe('movePanel', () => {
    it('should move panel to another scene', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');

      const scene1Id = useProjectStore.getState().project!.scenes[0].id;
      const scene2Id = useProjectStore.getState().project!.scenes[1].id;

      useProjectStore.getState().addPanel(scene1Id, { description: 'Moving Panel' });
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;

      useProjectStore.getState().movePanel(panelId, scene2Id);

      const scene1 = useProjectStore.getState().project!.scenes[0];
      const scene2 = useProjectStore.getState().project!.scenes[1];

      expect(scene1.panels).toHaveLength(0);
      expect(scene2.panels).toHaveLength(1);
      expect(scene2.panels[0].id).toBe(panelId);
    });

    it('should renumber panels in both scenes', () => {
      useProjectStore.getState().newProject('Test');
      useProjectStore.getState().addScene('Scene 2');

      const scene1Id = useProjectStore.getState().project!.scenes[0].id;
      const scene2Id = useProjectStore.getState().project!.scenes[1].id;

      // Add 2 panels to scene 1, 1 panel to scene 2
      useProjectStore.getState().addPanel(scene1Id);
      useProjectStore.getState().addPanel(scene1Id);
      useProjectStore.getState().addPanel(scene2Id);

      // Move first panel from scene 1 to scene 2
      const panelId = useProjectStore.getState().project!.scenes[0].panels[0].id;
      useProjectStore.getState().movePanel(panelId, scene2Id);

      const scene1 = useProjectStore.getState().project!.scenes[0];
      const scene2 = useProjectStore.getState().project!.scenes[1];

      // Scene 1 should have 1 panel numbered 1
      expect(scene1.panels[0].number).toBe(1);

      // Scene 2 should have 2 panels numbered 1 and 2
      expect(scene2.panels[0].number).toBe(1);
      expect(scene2.panels[1].number).toBe(2);
    });
  });
});
