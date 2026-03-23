import { useCallback } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@/stores/projectStore';
import { Project } from '@/types';

interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  scenes: any;
}

export function useProject() {
  const { project, loadProject, isDirty, markClean, updateProject } = useProjectStore();

  const saveProject = useCallback(async () => {
    if (!project) return;

    try {
      const filePath = await save({
        defaultPath: `${project.name}.scenex`,
        filters: [
          { name: 'SceneX Project', extensions: ['scenex'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (filePath) {
        const projectData: ProjectData = {
          id: project.id,
          name: project.name,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          scenes: project.scenes,
        };

        await invoke('save_project', { path: filePath, project: projectData });
        markClean();
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }, [project, markClean]);

  const openProject = useCallback(async () => {
    try {
      const filePath = await open({
        multiple: false,
        filters: [
          { name: 'SceneX Project', extensions: ['scenex'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (filePath && typeof filePath === 'string') {
        const data = await invoke<ProjectData>('load_project', { path: filePath });

        const project: Project = {
          id: data.id,
          name: data.name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          scenes: data.scenes,
        };

        loadProject(project);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      throw error;
    }
  }, [loadProject]);

  return {
    project,
    isDirty,
    saveProject,
    openProject,
    updateProject,
  };
}
