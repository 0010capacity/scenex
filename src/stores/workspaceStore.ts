import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_RECENT_PROJECTS } from '@/constants';

export interface RecentProject {
  projectPath: string;    // "/Users/john/MyProject"
  projectName: string;    // "MyProject"
  lastOpened?: string;
}

export interface ProjectInfo {
  path: string;
  name: string;
  filePath: string;
  modifiedAt?: string;
}

interface WorkspaceState {
  // Current project path
  currentProjectPath: string | null;
  currentProjectName: string | null;

  // Recent items
  recentProjects: RecentProject[];

  // Actions
  setCurrentProject: (path: string | null, name: string | null) => void;
  addRecentProject: (project: RecentProject) => void;
  clearCurrentProject: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentProjectPath: null,
      currentProjectName: null,
      recentProjects: [],

      setCurrentProject: (path, name) => {
        // Add to recent projects
        if (path && name) {
          const recentProject: RecentProject = {
            projectPath: path,
            projectName: name,
            lastOpened: new Date().toISOString(),
          };

          set((state) => {
            // Remove existing entry for this project
            const filtered = state.recentProjects.filter(
              (p) => p.projectPath !== path
            );

            // Add new entry at the beginning
            const updated = [recentProject, ...filtered];

            return {
              recentProjects: updated.slice(0, MAX_RECENT_PROJECTS),
            };
          });
        }

        set({
          currentProjectPath: path,
          currentProjectName: name,
        });
      },

      addRecentProject: (project) => {
        set((state) => {
          // Remove existing entry for this project
          const filtered = state.recentProjects.filter(
            (p) => p.projectPath !== project.projectPath
          );

          // Add new entry at the beginning
          const updated = [project, ...filtered];

          // Keep only the last 10
          return {
            recentProjects: updated.slice(0, 10),
          };
        });
      },

      clearCurrentProject: () => {
        set({
          currentProjectPath: null,
          currentProjectName: null,
        });
      },
    }),
    {
      name: 'scenex-workspace',
      partialize: (state) => ({
        currentProjectPath: state.currentProjectPath,
        currentProjectName: state.currentProjectName,
        recentProjects: state.recentProjects,
      }),
    }
  )
);
