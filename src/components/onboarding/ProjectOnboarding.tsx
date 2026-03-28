import { useState } from 'react';
import { Text } from '@mantine/core';
import { IconFolder, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function ProjectOnboarding() {
  const { createProject, openRecentProject, openProjectWithFilePicker, isLoading } = useWorkspace();
  const recentProjects = useWorkspaceStore(s => s.recentProjects);
  const [projectName, setProjectName] = useState('');
  const [selectedOption, setSelectedOption] = useState<'blank' | 'script' | 'storyboard' | 'existing' | null>(null);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    const template = selectedOption === 'existing' ? undefined : selectedOption ?? undefined;
    await createProject(projectName.trim(), template);
  };

  const handleOpenRecent = async (projectPath: string, projectName: string) => {
    await openRecentProject({ projectPath, projectName });
  };

  return (
    <div className="light-mode" style={styles.root}>
      {/* Left panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5" />
              <rect x="6" y="6" width="8" height="8" rx="1" fill="white" fillOpacity="0.9" />
              <rect x="18" y="6" width="8" height="8" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="6" y="18" width="8" height="8" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="18" y="18" width="8" height="8" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <Text style={styles.logoText}>SceneX</Text>
          <Text style={styles.tagline}>Storyboard Editor</Text>

          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
              <span>Visual Storyboard</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5L7 8.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              <span>AI Assistant</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9L3 12L4.5 7.5L1 5H5.5L7 1Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
              <span>Git Versioning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Actions */}
      <div style={styles.rightPanel}>
        <div style={styles.rightContent}>
          <Text style={styles.heading}>프로젝트 선택</Text>
          <Text style={styles.subheading}>시작할 방법을 선택하세요</Text>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div style={styles.section}>
              <Text style={styles.sectionLabel}>최근 프로젝트</Text>
              <div style={styles.recentList}>
                {recentProjects.slice(0, 3).map((recent) => (
                  <button
                    key={recent.projectPath}
                    style={styles.recentItem}
                    onClick={() => handleOpenRecent(recent.projectPath, recent.projectName)}
                    disabled={isLoading}
                  >
                    <IconFolder size={14} stroke={1.5} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                    <span style={styles.recentName}>{recent.projectName}</span>
                    <IconChevronRight size={10} stroke={1.5} style={{ color: 'var(--text3)', marginLeft: 'auto' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Project */}
          <div style={styles.section}>
            <Text style={styles.sectionLabel}>새 프로젝트</Text>
            <div style={styles.options}>
              <button
                style={{
                  ...styles.optionCard,
                  ...(selectedOption === 'blank' ? styles.optionCardSelected : {}),
                }}
                onClick={() => {
                  setSelectedOption('blank');
                  setProjectName('새 프로젝트');
                }}
              >
                <div style={styles.optionIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={styles.optionText}>
                  <span style={styles.optionTitle}>빈 프로젝트</span>
                </div>
              </button>

              <button
                style={{
                  ...styles.optionCard,
                  ...(selectedOption === 'script' ? styles.optionCardSelected : {}),
                }}
                onClick={() => {
                  setSelectedOption('script');
                  setProjectName('스크립트 프로젝트');
                }}
              >
                <div style={{ ...styles.optionIcon, backgroundColor: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5H16M4 10H12M4 15H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={styles.optionText}>
                  <span style={styles.optionTitle}>스크립트 먼저</span>
                </div>
              </button>

              <button
                style={{
                  ...styles.optionCard,
                  ...(selectedOption === 'storyboard' ? styles.optionCardSelected : {}),
                }}
                onClick={() => {
                  setSelectedOption('storyboard');
                  setProjectName('스토리보드 프로젝트');
                }}
              >
                <div style={{ ...styles.optionIcon, backgroundColor: 'rgba(232, 168, 56, 0.12)', color: '#E8A838' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
                <div style={styles.optionText}>
                  <span style={styles.optionTitle}>스토리보드 먼저</span>
                </div>
              </button>
            </div>

            {selectedOption && selectedOption !== 'existing' && (
              <div style={styles.projectNameField}>
                <input
                  type="text"
                  style={styles.textInput}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                />
              </div>
            )}

            {selectedOption && selectedOption !== 'existing' && (
              <button
                style={{
                  ...styles.createBtn,
                  ...(!projectName.trim() ? styles.createBtnDisabled : {}),
                }}
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isLoading}
              >
                <IconPlus size={14} stroke={2} style={{ marginRight: 6 }} />
                프로젝트 생성
              </button>
            )}
          </div>

          {/* Existing Project */}
          <div style={styles.section}>
            <Text style={styles.sectionLabel}>기존 프로젝트</Text>
            <button
              style={styles.openExistingBtn}
              onClick={openProjectWithFilePicker}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 4.5C2 3.67 2.67 3 3.5 3H6L7.5 4.5H12.5C13.33 4.5 14 5.17 14 6V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              .scenex 파일 열기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: 'var(--bg0)',
    overflow: 'hidden',
  },
  leftPanel: {
    width: 280,
    backgroundColor: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leftContent: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoMark: {
    marginBottom: 12,
  },
  logoText: {
    fontFamily: 'var(--serif)',
    fontSize: 24,
    fontWeight: 400,
    color: 'var(--text-inverse)',
    letterSpacing: '0.02em',
    marginBottom: 4,
  },
  tagline: {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--text-inverse-dim)',
    marginBottom: 40,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--text-inverse-dim)',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 'var(--r6)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-inverse)',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg0)',
    overflowY: 'auto',
  },
  rightContent: {
    width: '100%',
    maxWidth: 480,
    padding: 40,
  },
  heading: {
    fontFamily: 'var(--sans)',
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 4,
  },
  subheading: {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--text2)',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'var(--sans)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r6)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  recentName: {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--text)',
  },
  options: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '16px 12px',
    backgroundColor: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r8)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  optionCardSelected: {
    borderColor: 'var(--accent)',
    backgroundColor: 'var(--accent-dim)',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 'var(--r6)',
    backgroundColor: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  optionTitle: {
    fontFamily: 'var(--sans)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text)',
  },
  projectNameField: {
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r6)',
    fontFamily: 'var(--sans)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    backgroundColor: 'var(--accent)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 'var(--r6)',
    fontFamily: 'var(--sans)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    width: '100%',
  },
  createBtnDisabled: {
    backgroundColor: 'var(--border)',
    color: 'var(--text3)',
    cursor: 'not-allowed',
  },
  openExistingBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: 'var(--bg1)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r6)',
    fontFamily: 'var(--sans)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    width: '100%',
  },
};
