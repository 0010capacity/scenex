import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore, ProjectInfo, RecentProject } from '@/stores/workspaceStore';
import { useProjectStore } from '@/stores/projectStore';
import { Project, migrateProject } from '@/types';
import { useUIStore } from '@/stores/uiStore';

interface ProjectData {
  id: string;
  name: string;
  // Support both camelCase (from create_project) and snake_case (legacy)
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  scenario?: any;
  scenes?: any;
  scenarios?: any[];
}

interface CreateProjectResult {
  path: string;
  name: string;
  file_path: string;
  modified_at?: string;
}

export function useWorkspace() {
  const currentProjectPath = useWorkspaceStore(s => s.currentProjectPath);
  const currentProjectName = useWorkspaceStore(s => s.currentProjectName);
  const recentProjects = useWorkspaceStore(s => s.recentProjects);
  const setCurrentProject = useWorkspaceStore(s => s.setCurrentProject);
  const addRecentProject = useWorkspaceStore(s => s.addRecentProject);

  const loadProject = useProjectStore(s => s.loadProject);
  const project = useProjectStore(s => s.project);
  const closeProjectBrowser = useUIStore(s => s.closeProjectBrowser);
  const addNotification = useUIStore(s => s.addNotification);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new project - prompts for folder and name
  const createProject = useCallback(async (name: string, template?: 'blank' | 'script' | 'storyboard'): Promise<ProjectInfo | null> => {
    if (template) {
      console.log('[Workspace] Project creation requested with template:', template);
    }

    try {
      setIsLoading(true);

      // Ask user to select parent folder
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '프로젝트를 만들 폴더를 선택하세요',
        canCreateDirectories: true,
      });

      if (!selectedPath || typeof selectedPath !== 'string') {
        // User cancelled
        return null;
      }

      const projectInfo = await invoke<CreateProjectResult>('create_project', {
        parentFolderPath: selectedPath,
        projectName: name,
      });

      const fullProjectInfo: ProjectInfo = {
        path: projectInfo.path,
        name: projectInfo.name,
        filePath: projectInfo.file_path,
        modifiedAt: projectInfo.modified_at,
      };

      // Load the newly created project
      await loadProjectFromFile(fullProjectInfo.filePath);

      return fullProjectInfo;
    } catch (error) {
      console.error('Failed to create project:', error);
      addNotification('error', `Failed to create project: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Load a project from file
  const loadProjectFromFile = useCallback(async (filePath: string): Promise<boolean> => {
    console.log('[Workspace] loadProjectFromFile called with:', filePath);
    try {
      setIsLoading(true);
      console.log('[Workspace] Invoking load_project...');
      const response = await invoke<{ success: boolean; data: { project: ProjectData } }>('load_project', { path: filePath });
      console.log('[Workspace] load_project response:', response);

      if (!response.success || !response.data?.project) {
        throw new Error('Failed to load project: invalid response');
      }

      const data = response.data.project;
      console.log('[Workspace] Project data loaded:', data);

      // Migrate legacy format to new single-scenario format
      const migratedProject = migrateProject({
        id: data.id,
        name: data.name,
        createdAt: data.createdAt ?? data.created_at,
        updatedAt: data.updatedAt ?? data.updated_at,
        scenario: data.scenario,
        scenes: data.scenes,
        scenarios: data.scenarios,
      } as any);

      console.log('[Workspace] Migrated project:', migratedProject);
      loadProject(migratedProject);
      console.log('[Workspace] loadProject called');

      // Extract project name and path from file path
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const projectName = fileName.replace('.scenex', '');
      const projectDir = pathParts.slice(0, -1).join('/');

      // Set current project
      setCurrentProject(projectDir, projectName);

      // Add to recent projects
      const recentProject: RecentProject = {
        projectPath: projectDir,
        projectName: projectName,
        lastOpened: new Date().toISOString(),
      };
      addRecentProject(recentProject);

      closeProjectBrowser();
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      addNotification('error', `Failed to load project: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadProject, setCurrentProject, addRecentProject, closeProjectBrowser, addNotification]);

  // Save project with git auto-commit
  const saveProjectWithAutoCommit = useCallback(async (projectToSave?: Project): Promise<boolean> => {
    const proj = projectToSave || project;
    if (!proj) {
      addNotification('error', 'No project to save');
      return false;
    }

    if (!currentProjectPath) {
      addNotification('error', 'No project selected');
      return false;
    }

    try {
      setIsLoading(true);
      const filePath = `${currentProjectPath}/${proj.name}.scenex`;

      const projectData = {
        id: proj.id,
        name: proj.name,
        created_at: proj.createdAt,
        updated_at: proj.updatedAt,
        scenario: proj.scenario,
      };

      // Save the project file
      await invoke('save_project', { path: filePath, project: projectData });

      // Git auto-commit
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const commitMessage = `Auto-save: ${proj.name} at ${timestamp}`;

      await invoke<string>('git_auto_commit', {
        projectFolderPath: currentProjectPath,
        projectName: proj.name,
        message: commitMessage,
      });

      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      addNotification('error', `Failed to save project: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [project, currentProjectPath, addNotification]);

  // Open a recent project
  const openRecentProject = useCallback(async (recent: RecentProject): Promise<boolean> => {
    const filePath = `${recent.projectPath}/${recent.projectName}.scenex`;
    return await loadProjectFromFile(filePath);
  }, [loadProjectFromFile]);

  // Open project with file picker (.scenex file)
  const openProjectWithFilePicker = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      const selectedPath = await open({
        directory: false,
        multiple: false,
        title: '프로젝트 파일 열기',
        filters: [{ name: 'SceneX Project', extensions: ['scenex'] }],
      });

      if (!selectedPath || typeof selectedPath !== 'string') {
        return false;
      }

      return await loadProjectFromFile(selectedPath);
    } catch (error) {
      console.error('Failed to open project:', error);
      addNotification('error', `Failed to open project: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjectFromFile, addNotification]);

  return {
    // State
    currentProjectPath,
    currentProjectName,
    recentProjects,
    isLoading,

    // Project operations
    createProject,
    loadProjectFromFile,
    saveProjectWithAutoCommit,
    openRecentProject,
    openProjectWithFilePicker,
  };
}
