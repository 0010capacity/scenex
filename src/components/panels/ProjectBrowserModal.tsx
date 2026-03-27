import { Box, Text, Loader, TextInput } from '@mantine/core';
import { IconPlus, IconFolder, IconChevronRight, IconClock, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { WorkspaceInfo, ProjectInfo } from '@/stores/workspaceStore';
import { useWorkspace } from '@/hooks/useWorkspace';

export function ProjectBrowserModal() {
  const { projectBrowserOpen, closeProjectBrowser, addNotification } = useUIStore();
  const {
    currentWorkspacePath,
    currentProjectName,
    recentProjects,
    getDefaultWorkspacesDir,
    listWorkspaces,
    listProjects,
    createWorkspace,
    selectWorkspace,
    createProject,
    loadProjectFromFile,
    openRecentProject,
    isLoading,
  } = useWorkspace();

  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceInfo | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    if (projectBrowserOpen) {
      loadWorkspaces();
    }
  }, [projectBrowserOpen]);

  // Load projects when workspace is selected
  useEffect(() => {
    if (selectedWorkspace) {
      loadProjectsForWorkspace(selectedWorkspace.path);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const defaultDir = await getDefaultWorkspacesDir();
      const workspaceList = await listWorkspaces(defaultDir);
      setWorkspaces(workspaceList);

      // Auto-select current workspace if set
      if (currentWorkspacePath) {
        const current = workspaceList.find((w) => w.path === currentWorkspacePath);
        if (current) {
          setSelectedWorkspace(current);
        } else if (workspaceList.length > 0) {
          setSelectedWorkspace(workspaceList[0]);
        }
      } else if (workspaceList.length > 0) {
        setSelectedWorkspace(workspaceList[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      addNotification('error', `워크스페이스 로드 실패: ${error}`);
    }
  };

  const loadProjectsForWorkspace = async (workspacePath: string) => {
    try {
      const projectList = await listProjects(workspacePath);
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      addNotification('error', `프로젝트 로드 실패: ${error}`);
      setProjects([]);
    }
  };

  const handleCreateWorkspace = async () => {
    const workspace = await createWorkspace();
    if (workspace) {
      setWorkspaces((prev) => [...prev, workspace]);
      setSelectedWorkspace(workspace);
    }
  };

  const handleSelectWorkspace = (workspace: WorkspaceInfo) => {
    selectWorkspace(workspace);
    setSelectedWorkspace(workspace);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !selectedWorkspace) return;

    setIsCreatingProject(true);
    try {
      const project = await createProject(newProjectName.trim());
      if (project) {
        setProjects((prev) => [...prev, project]);
        setNewProjectName('');
        setShowNewProjectInput(false);
      }
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenProject = async (project: ProjectInfo) => {
    await loadProjectFromFile(project.filePath);
  };

  const handleOpenRecent = async (recent: typeof recentProjects[0]) => {
    await openRecentProject(recent);
  };

  if (!projectBrowserOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeProjectBrowser();
  };

  return (
    <Box className="modal-backdrop open" onClick={handleBackdropClick}>
      <Box
        style={{
          width: 720,
          height: 480,
          background: 'var(--bg1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
            Project Browser
          </Text>
          <button
            onClick={closeProjectBrowser}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3)',
              padding: 4,
            }}
          >
            <IconX size={16} stroke={1.5} />
          </button>
        </Box>

        {/* Body */}
        <Box
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left: Workspaces */}
          <Box
            style={{
              width: 200,
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Workspaces
              </Text>
              <button
                onClick={handleCreateWorkspace}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  cursor: isLoading ? 'wait' : 'pointer',
                  color: 'var(--text2)',
                  padding: '3px 6px',
                  borderRadius: 'var(--r4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  minWidth: 24,
                  minHeight: 24,
                }}
                title="New Workspace"
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'var(--bg2)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--text2)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {isLoading ? <Loader size={12} color="var(--gold)" /> : <IconPlus size={14} stroke={1.5} />}
              </button>
            </Box>
            <Box style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {workspaces.map((workspace) => (
                <Box
                  key={workspace.path}
                  onClick={() => handleSelectWorkspace(workspace)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background:
                      selectedWorkspace?.path === workspace.path
                        ? 'var(--bg2)'
                        : 'transparent',
                    borderLeft:
                      selectedWorkspace?.path === workspace.path
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                  }}
                >
                  <IconFolder size={14} stroke={1.5} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {workspace.name}
                  </Text>
                  {workspace.path === currentWorkspacePath && (
                    <Box
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
              ))}
              {workspaces.length === 0 && (
                <Text
                  style={{
                    fontSize: 11,
                    color: 'var(--text3)',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  No workspaces yet
                </Text>
              )}
            </Box>
          </Box>

          {/* Right: Projects */}
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {selectedWorkspace ? `Projects in "${selectedWorkspace.name}"` : 'Projects'}
              </Text>
              {selectedWorkspace && (
                <button
                  onClick={() => setShowNewProjectInput(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text3)',
                    padding: 2,
                  }}
                  title="New Project"
                >
                  <IconPlus size={14} stroke={1.5} />
                </button>
              )}
            </Box>

            {/* New Project Input */}
            {showNewProjectInput && (
              <Box style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <Box style={{ display: 'flex', gap: 8 }}>
                  <TextInput
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') {
                        setShowNewProjectInput(false);
                        setNewProjectName('');
                      }
                    }}
                    autoFocus
                    style={{ flex: 1 }}
                    size="xs"
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || isCreatingProject}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--r4)',
                      fontSize: 11,
                      cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newProjectName.trim() ? 1 : 0.5,
                    }}
                  >
                    {isCreatingProject ? <Loader size={10} color="white" /> : 'Create'}
                  </button>
                </Box>
              </Box>
            )}

            {/* Projects Grid */}
            <Box style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                {projects.map((project) => (
                  <Box
                    key={project.path}
                    onClick={() => handleOpenProject(project)}
                    style={{
                      padding: 16,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r4)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease',
                      outline:
                        project.name === currentProjectName
                          ? '2px solid var(--accent)'
                          : 'none',
                    }}
                  >
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        background: 'var(--bg3)',
                        borderRadius: 'var(--r4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconFolder size={24} stroke={1.5} style={{ color: 'var(--text3)' }} />
                    </Box>
                    <Text
                      style={{
                        fontSize: 11,
                        color: 'var(--text)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                      }}
                    >
                      {project.name}
                    </Text>
                  </Box>
                ))}
                {projects.length === 0 && selectedWorkspace && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: 'var(--text3)',
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: 24,
                    }}
                  >
                    No projects in this workspace
                  </Text>
                )}
                {!selectedWorkspace && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: 'var(--text3)',
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: 24,
                    }}
                  >
                    Select a workspace to view projects
                  </Text>
                )}
              </Box>
            </Box>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <Box
                style={{
                  borderTop: '1px solid var(--border)',
                  padding: '8px 12px',
                  maxHeight: 100,
                  overflowY: 'auto',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Recent
                </Text>
                {recentProjects.slice(0, 3).map((recent) => (
                  <Box
                    key={recent.projectPath}
                    onClick={() => handleOpenRecent(recent)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      borderRadius: 'var(--r4)',
                    }}
                  >
                    <IconClock size={12} stroke={1.5} style={{ color: 'var(--text3)' }} />
                    <Text style={{ fontSize: 11, color: 'var(--text)' }}>
                      {recent.projectName}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'var(--text3)' }}>
                      — {recent.workspaceName}
                    </Text>
                    <IconChevronRight size={10} stroke={1.5} style={{ color: 'var(--text3)', marginLeft: 'auto' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Loading Overlay */}
        {isLoading && (
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader color="var(--accent)" />
          </Box>
        )}
      </Box>
    </Box>
  );
}
