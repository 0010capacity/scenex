import { SegmentedControl } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function EditorSection() {
  const { settings, updateEditorSettings } = useSettingsStore();

  const editorSettings = settings?.editor;

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label">기본 워크스페이스 모드</label>
        <SegmentedControl
          value={editorSettings?.defaultWorkspaceMode || 'scenario'}
          onChange={(value) => updateEditorSettings({ defaultWorkspaceMode: value as 'scenario' | 'storyboard' })}
          data={[
            { label: '시나리오', value: 'scenario' },
            { label: '스토리보드', value: 'storyboard' },
          ]}
          classNames={{
            root: 'settings-segmented',
          }}
        />
        <p className="settings-hint">
          앱 시작 시 기본으로 사용할 워크스페이스 모드입니다.
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-label">기본 패널 뷰</label>
        <SegmentedControl
          value={editorSettings?.defaultPanelView || 'grid'}
          onChange={(value) => updateEditorSettings({ defaultPanelView: value as 'grid' | 'strip' | 'slide' })}
          data={[
            { label: '그리드', value: 'grid' },
            { label: '스트립', value: 'strip' },
            { label: '슬라이드', value: 'slide' },
          ]}
          classNames={{
            root: 'settings-segmented',
          }}
        />
        <p className="settings-hint">
          패널을 표시할 때 사용할 기본 레이아웃입니다.
        </p>
      </div>
    </div>
  );
}
