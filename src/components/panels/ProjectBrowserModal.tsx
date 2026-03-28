import { Box, Text, Loader, TextInput } from '@mantine/core';
import { IconFolder, IconClock, IconX, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspace } from '@/hooks/useWorkspace';

export function ProjectBrowserModal() {
  const projectBrowserOpen = useUIStore(s => s.projectBrowserOpen);
  const closeProjectBrowser = useUIStore(s => s.closeProjectBrowser);
  const {
    currentProjectName,
    recentProjects,
    createProject,
    openRecentProject,
    openProjectWithFilePicker,
    isLoading,
  } = useWorkspace();

  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const project = await createProject(newProjectName.trim());
      if (project) {
        setNewProjectName('');
        setShowNewProjectInput(false);
      }
    } finally {
      setIsCreatingProject(false);
    }
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
          width: 560,
          height: 420,
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
            프로젝트 브라우저
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
          {/* Left: Recent Projects */}
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
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
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
                최근
              </Text>
            </Box>
            <Box style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {recentProjects.map((recent) => (
                <Box
                  key={recent.projectPath}
                  onClick={() => handleOpenRecent(recent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background:
                      recent.projectName === currentProjectName
                        ? 'var(--bg2)'
                        : 'transparent',
                  }}
                >
                  <IconClock size={12} stroke={1.5} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {recent.projectName}
                  </Text>
                </Box>
              ))}
              {recentProjects.length === 0 && (
                <Text
                  style={{
                    fontSize: 11,
                    color: 'var(--text3)',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  최근 프로젝트 없음
                </Text>
              )}
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* New Project Input */}
            {showNewProjectInput && (
              <Box style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Box style={{ display: 'flex', gap: 8 }}>
                  <TextInput
                    placeholder="프로젝트 이름"
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
                    {isCreatingProject ? <Loader size={10} color="white" /> : '생성'}
                  </button>
                </Box>
              </Box>
            )}

            {/* Actions */}
            <Box style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* New Project Button */}
              {!showNewProjectInput && (
                <button
                  onClick={() => setShowNewProjectInput(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 16px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--r6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <IconPlus size={16} stroke={2} />
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>새 프로젝트</Text>
                </button>
              )}

              {/* Open Existing Button */}
              <button
                onClick={openProjectWithFilePicker}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 16px',
                  background: 'var(--bg2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r6)',
                  cursor: isLoading ? 'wait' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <IconFolder size={16} stroke={1.5} style={{ color: 'var(--text3)' }} />
                <Text style={{ fontSize: 13, fontWeight: 500 }}>.scenex 파일 열기</Text>
              </button>
            </Box>
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
