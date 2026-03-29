import { TextInput, SegmentedControl } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function AISection() {
  const { settings, updateAISettings } = useSettingsStore();

  const aiSettings = settings?.ai;

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label">Claude CLI 경로</label>
        <TextInput
          value={aiSettings?.claudeCliPath || ''}
          onChange={(e) => updateAISettings({ claudeCliPath: e.currentTarget.value })}
          placeholder="/usr/local/bin/claude"
          classNames={{
            input: 'settings-input',
          }}
          rightSection={
            <span className="settings-validation">
              {aiSettings?.claudeCliPath ? '✓' : '✗'}
            </span>
          }
        />
        <p className="settings-hint">
          Claude CLI의 절대 경로를 입력하세요. 예: /usr/local/bin/claude
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-label">AI 응답 언어</label>
        <SegmentedControl
          value={aiSettings?.responseLanguage || 'ko'}
          onChange={(value) => updateAISettings({ responseLanguage: value })}
          data={[
            { label: '한국어', value: 'ko' },
            { label: 'English', value: 'en' },
          ]}
          classNames={{
            root: 'settings-segmented',
          }}
        />
        <p className="settings-hint">
          AI가 응답할 때 사용할 언어를 선택하세요.
        </p>
      </div>
    </div>
  );
}
