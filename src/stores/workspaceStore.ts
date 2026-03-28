import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_RECENT_PROJECTS } from '@/constants';

export interface RecentProject {
  workspacePath: string;
  workspaceName: string;
  projectPath: string;
  projectName: string;
  lastOpened?: string;
}

export interface WorkspaceInfo {
  path: string;
  name: string;
  isGitRepo: boolean;
}

export interface ProjectInfo {
  path: string;
  name: string;
  filePath: string;
  modifiedAt?: string;
}

interface WorkspaceState {
  // Current workspace and project paths
  currentWorkspacePath: string | null;
  currentWorkspaceName: string | null;
  currentProjectPath: string | null;
  currentProjectName: string | null;

  // Recent items
  recentProjects: RecentProject[];

  // Computed
  hasWorkspace: () => boolean;

  // Actions
  setCurrentWorkspace: (path: string | null, name: string | null) => void;
  setCurrentProject: (path: string | null, name: string | null) => void;
  addRecentProject: (project: RecentProject) => void;
  clearCurrentWorkspace: () => void;
  clearCurrentProject: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspacePath: null,
      currentWorkspaceName: null,
      currentProjectPath: null,
      currentProjectName: null,
      recentProjects: [],

      hasWorkspace: () => {
        return get().currentWorkspacePath !== null;
      },

      setCurrentWorkspace: (path, name) => {
        set({
          currentWorkspacePath: path,
          currentWorkspaceName: name,
        });
      },

      setCurrentProject: (path, name) => {
        const state = get();

        // Add to recent projects
        if (path && name && state.currentWorkspacePath && state.currentWorkspaceName) {
          const recentProject: RecentProject = {
            workspacePath: state.currentWorkspacePath,
            workspaceName: state.currentWorkspaceName,
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

      clearCurrentWorkspace: () => {
        set({
          currentWorkspacePath: null,
          currentWorkspaceName: null,
          currentProjectPath: null,
          currentProjectName: null,
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
        currentWorkspacePath: state.currentWorkspacePath,
        currentWorkspaceName: state.currentWorkspaceName,
        currentProjectPath: state.currentProjectPath,
        currentProjectName: state.currentProjectName,
        recentProjects: state.recentProjects,
      }),
    }
  )
);
