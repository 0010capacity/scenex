import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore, WorkspaceInfo, ProjectInfo, RecentProject } from '@/stores/workspaceStore';
import { useProjectStore } from '@/stores/projectStore';
import { Project } from '@/types';
import { useUIStore } from '@/stores/uiStore';

interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  scenes: any;
  scenarios?: any[];
}

interface CreateProjectResult {
  path: string;
  name: string;
  file_path: string;
  modified_at?: string;
}

export function useWorkspace() {
  const currentWorkspacePath = useWorkspaceStore(s => s.currentWorkspacePath);
  const currentWorkspaceName = useWorkspaceStore(s => s.currentWorkspaceName);
  const currentProjectPath = useWorkspaceStore(s => s.currentProjectPath);
  const currentProjectName = useWorkspaceStore(s => s.currentProjectName);
  const recentProjects = useWorkspaceStore(s => s.recentProjects);
  const setCurrentWorkspace = useWorkspaceStore(s => s.setCurrentWorkspace);
  const setCurrentProject = useWorkspaceStore(s => s.setCurrentProject);
  const addRecentProject = useWorkspaceStore(s => s.addRecentProject);

  const loadProject = useProjectStore(s => s.loadProject);
  const project = useProjectStore(s => s.project);
  const closeProjectBrowser = useUIStore(s => s.closeProjectBrowser);
  const addNotification = useUIStore(s => s.addNotification);
  const [isLoading, setIsLoading] = useState(false);

  // Get the default workspaces directory
  const getDefaultWorkspacesDir = useCallback(async (): Promise<string> => {
    return await invoke<string>('get_default_workspaces_dir');
  }, []);

  // List all workspaces in a parent directory
  const listWorkspaces = useCallback(async (parentPath: string): Promise<WorkspaceInfo[]> => {
    return await invoke<WorkspaceInfo[]>('list_workspaces', { parentPath });
  }, []);

  // List all projects in a workspace
  const listProjects = useCallback(async (workspacePath: string): Promise<ProjectInfo[]> => {
    return await invoke<ProjectInfo[]>('list_projects', { workspacePath });
  }, []);

  // Create a new workspace
  const createWorkspace = useCallback(async (): Promise<WorkspaceInfo | null> => {
    try {
      setIsLoading(true);

      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
        canCreateDirectories: true,
      });

      if (!selectedPath || typeof selectedPath !== 'string') {
        // User cancelled
        return null;
      }

      const workspace = await invoke<WorkspaceInfo>('create_workspace', { path: selectedPath });
      setCurrentWorkspace(workspace.path, workspace.name);
      addNotification('info', `Workspace "${workspace.name}" created`);
      return workspace;
    } catch (error) {
      console.error('[Workspace] Failed to create workspace:', error);
      addNotification('error', `Failed to create workspace: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentWorkspace, addNotification]);

  // Select an existing workspace (just set it as current)
  const selectWorkspace = useCallback((workspace: WorkspaceInfo) => {
    setCurrentWorkspace(workspace.path, workspace.name);
  }, [setCurrentWorkspace]);

  // Open an existing workspace (folder picker)
  const openWorkspace = useCallback(async (): Promise<WorkspaceInfo | null> => {
    try {
      setIsLoading(true);

      console.log('[Workspace] Opening folder picker for existing workspace...');

      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
        canCreateDirectories: false,
      });

      console.log('[Workspace] Folder picker returned:', selectedPath);

      if (!selectedPath || typeof selectedPath !== 'string') {
        console.log('[Workspace] User cancelled folder picker');
        return null;
      }

      // Extract workspace name from path
      const pathParts = selectedPath.split('/');
      const workspaceName = pathParts[pathParts.length - 1] || 'Workspace';

      // Set as current workspace without creating anything
      setCurrentWorkspace(selectedPath, workspaceName);

      const workspace: WorkspaceInfo = {
        path: selectedPath,
        name: workspaceName,
        isGitRepo: false,
      };

      addNotification('info', `Workspace "${workspaceName}" opened`);
      return workspace;
    } catch (error) {
      console.error('[Workspace] Failed to open workspace:', error);
      addNotification('error', `Failed to open workspace: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentWorkspace, addNotification]);

  // Create a new project in the current workspace
  const createProject = useCallback(async (name: string, template?: 'blank' | 'script' | 'storyboard'): Promise<ProjectInfo | null> => {
    // Log the template preference for future use when backend supports templates
    if (template) {
      console.log('[Workspace] Project creation requested with template:', template);
    }
    if (!currentWorkspacePath) {
      addNotification('error', 'No workspace selected');
      return null;
    }

    try {
      setIsLoading(true);
      const projectInfo = await invoke<CreateProjectResult>('create_project', {
        workspacePath: currentWorkspacePath,
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
  }, [currentWorkspacePath, addNotification]);

  // Load a project from file
  const loadProjectFromFile = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await invoke<ProjectData>('load_project', { path: filePath });

      const loadedProject: Project = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        scenes: data.scenes,
        scenarios: data.scenarios || [],
      };

      loadProject(loadedProject);

      // Extract project name and workspace from path
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const projectName = fileName.replace('.scenex', '');
      const projectDir = pathParts.slice(0, -1).join('/');
      const workspacePath = pathParts.slice(0, -2).join('/');
      const workspaceName = pathParts[pathParts.length - 2] || 'Workspace';

      // Set current project
      setCurrentProject(projectDir, projectName);

      // Set workspace if not set
      if (!currentWorkspacePath) {
        setCurrentWorkspace(workspacePath, workspaceName);
      }

      // Add to recent projects
      const recentProject: RecentProject = {
        workspacePath: workspacePath,
        workspaceName: workspaceName,
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
  }, [loadProject, setCurrentProject, setCurrentWorkspace, addRecentProject, currentWorkspacePath, closeProjectBrowser, addNotification]);

  // Save project with git auto-commit
  const saveProjectWithAutoCommit = useCallback(async (projectToSave?: Project): Promise<boolean> => {
    const proj = projectToSave || project;
    if (!proj) {
      addNotification('error', 'No project to save');
      return false;
    }

    if (!currentWorkspacePath || !currentProjectPath) {
      addNotification('error', 'No workspace or project selected');
      return false;
    }

    try {
      setIsLoading(true);
      const filePath = `${currentProjectPath}/${proj.name}.scenex`;

      const projectData: ProjectData = {
        id: proj.id,
        name: proj.name,
        created_at: proj.createdAt,
        updated_at: proj.updatedAt,
        scenes: proj.scenes,
      };

      // Save the project file
      await invoke('save_project', { path: filePath, project: projectData });

      // Git auto-commit
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const commitMessage = `Auto-save: ${proj.name} at ${timestamp}`;

      await invoke<string>('git_auto_commit', {
        workspacePath: currentWorkspacePath,
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
  }, [project, currentWorkspacePath, currentProjectPath, addNotification]);

  // Open a recent project
  const openRecentProject = useCallback(async (recent: RecentProject): Promise<boolean> => {
    // Set workspace first
    setCurrentWorkspace(recent.workspacePath, recent.workspaceName);

    // Load the project
    const filePath = `${recent.projectPath}/${recent.projectName}.scenex`;
    return await loadProjectFromFile(filePath);
  }, [setCurrentWorkspace, loadProjectFromFile]);

  return {
    // State
    currentWorkspacePath,
    currentWorkspaceName,
    currentProjectPath,
    currentProjectName,
    recentProjects,
    isLoading,

    // Workspace operations
    getDefaultWorkspacesDir,
    listWorkspaces,
    createWorkspace,
    openWorkspace,
    selectWorkspace,

    // Project operations
    listProjects,
    createProject,
    loadProjectFromFile,
    saveProjectWithAutoCommit,
    openRecentProject,
  };
}
