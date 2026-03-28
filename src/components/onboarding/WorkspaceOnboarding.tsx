import { Text } from '@mantine/core';
import { useWorkspace } from '@/hooks/useWorkspace';

export function WorkspaceOnboarding() {
  const { createWorkspace, openWorkspace, isLoading } = useWorkspace();

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
              <span>Project Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Actions */}
      <div style={styles.rightPanel}>
        <div style={styles.rightContent}>
          <Text style={styles.heading}>시작하기</Text>
          <Text style={styles.stepIndicator}>Step 1 / 2</Text>

          <div style={styles.actions}>
            {/* New workspace */}
            <button
              style={styles.primaryBtn}
              onClick={createWorkspace}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              새 워크스페이스 만들기
            </button>

            {/* Open existing workspace */}
            <button style={styles.secondaryBtn} onClick={openWorkspace} disabled={isLoading}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 4.5C2 3.67 2.67 3 3.5 3H6L7.5 4.5H12.5C13.33 4.5 14 5.17 14 6V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              기존 워크스페이스 열기
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
  },
  rightContent: {
    width: '100%',
    maxWidth: 380,
    padding: 40,
  },
  heading: {
    fontFamily: 'var(--sans)',
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 4,
  },
  stepIndicator: {
    fontFamily: 'var(--mono)',
    fontSize: 12,
    color: 'var(--text3)',
    marginBottom: 32,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 40,
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 20px',
    backgroundColor: 'var(--accent)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: 'var(--r10)',
    fontFamily: 'var(--sans)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 20px',
    backgroundColor: 'var(--bg1)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r10)',
    fontFamily: 'var(--sans)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
