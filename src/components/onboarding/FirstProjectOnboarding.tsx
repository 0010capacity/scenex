import { useState } from 'react';
import { Text } from '@mantine/core';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function FirstProjectOnboarding() {
  const { createProject, recentProjects, isLoading } = useWorkspace();
  const currentWorkspaceName = useWorkspaceStore(s => s.currentWorkspaceName);
  const [projectName, setProjectName] = useState('');
  const [selectedOption, setSelectedOption] = useState<'blank' | 'script' | 'storyboard' | 'existing' | null>(null);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    const template = selectedOption === 'existing' ? undefined : selectedOption ?? undefined;
    await createProject(projectName.trim(), template);
  };

  return (
    <div className="light-mode" style={styles.root}>
      {/* Left panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.2" />
              <rect x="6" y="6" width="8" height="8" rx="1" fill="white" fillOpacity="0.9" />
              <rect x="18" y="6" width="8" height="8" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="6" y="18" width="8" height="8" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="18" y="18" width="8" height="8" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <Text style={styles.logoText}>SceneX</Text>

          <div style={styles.workspaceInfo}>
            <span style={styles.workspaceLabel}>Workspace</span>
            <span style={styles.workspaceName}>{currentWorkspaceName || 'My Workspace'}</span>
          </div>
        </div>
      </div>

      {/* Right panel - Actions */}
      <div style={styles.rightPanel}>
        <div style={styles.rightContent}>
          <Text style={styles.heading}>첫 프로젝트</Text>
          <Text style={styles.subheading}>작업을 시작하세요</Text>

          <div style={styles.options}>
            {/* Blank project */}
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
                <span style={styles.optionDesc}>스크립트 + 스토리보드</span>
              </div>
            </button>

            {/* Script first */}
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
                <span style={styles.optionDesc}>스크립트로 시작</span>
              </div>
            </button>

            {/* Storyboard first */}
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
                <span style={styles.optionDesc}>스토리보드로 시작</span>
              </div>
            </button>

            {/* Open existing */}
            <button
              style={{
                ...styles.optionCard,
                ...(selectedOption === 'existing' ? styles.optionCardSelected : {}),
              }}
              onClick={() => setSelectedOption('existing')}
              disabled={recentProjects.length === 0}
            >
              <div style={{ ...styles.optionIcon, backgroundColor: 'rgba(107, 107, 107, 0.08)', color: '#6B6B6B' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6C3 5.17 3.67 4.5 4.5 4.5H7.5L9 6H15.5C16.33 6 17 6.67 17 7.5V13.5C17 14.33 16.33 15 15.5 15H4.5C3.67 15 3 14.33 3 13.5V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div style={styles.optionText}>
                <span style={styles.optionTitle}>기존 프로젝트 열기</span>
                <span style={styles.optionDesc}>
                  {recentProjects.length > 0
                    ? `${recentProjects.length}개의 최근 프로젝트`
                    : '열 수 있는 프로젝트 없음'}
                </span>
              </div>
            </button>
          </div>

          {selectedOption !== 'existing' && (
            <div style={styles.projectNameField}>
              <label style={styles.fieldLabel}>프로젝트 이름</label>
              <input
                type="text"
                style={styles.textInput}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
              />
            </div>
          )}

          <button
            style={{
              ...styles.createBtn,
              ...(!selectedOption || !projectName.trim() ? styles.createBtnDisabled : {}),
            }}
            onClick={handleCreateProject}
            disabled={!selectedOption || !projectName.trim() || isLoading}
          >
            생성
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 6 }}>
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
    width: 200,
    backgroundColor: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leftContent: {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoMark: {
    marginBottom: 8,
  },
  logoText: {
    fontFamily: 'var(--serif)',
    fontSize: 18,
    fontWeight: 400,
    color: '#FFFFFF',
    letterSpacing: '0.02em',
    marginBottom: 24,
  },
  workspaceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  workspaceLabel: {
    fontFamily: 'var(--sans)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  workspaceName: {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg0)',
  },
  rightContent: {
    width: '100%',
    maxWidth: 420,
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
  options: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px',
    backgroundColor: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r10)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  optionCardSelected: {
    borderColor: 'var(--accent)',
    backgroundColor: 'var(--accent-dim)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--r8)',
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
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text)',
  },
  optionDesc: {
    fontFamily: 'var(--sans)',
    fontSize: 11,
    color: 'var(--text3)',
  },
  projectNameField: {
    marginBottom: 20,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: 'var(--sans)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text2)',
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r8)',
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
    padding: '12px 24px',
    backgroundColor: 'var(--accent)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 'var(--r8)',
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
};
