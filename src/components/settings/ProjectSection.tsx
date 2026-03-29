import { NumberInput, Switch, Group } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function ProjectSection() {
  const { settings, updateProjectSettings } = useSettingsStore();

  const projectSettings = settings?.project;

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label">자동 저장 간격</label>
        <Group gap="xs">
          <NumberInput
            value={projectSettings?.autoSaveInterval || 30}
            onChange={(value) => updateProjectSettings({ autoSaveInterval: Number(value) || 30 })}
            min={10}
            max={300}
            step={10}
            classNames={{
              input: 'settings-number-input',
            }}
            w={100}
          />
          <span className="settings-suffix">초</span>
        </Group>
        <p className="settings-hint">
          자동으로 프로젝트를 저장하는 간격입니다 (10-300초).
        </p>
      </div>

      <div className="settings-field">
        <Group justify="space-between" align="center">
          <div>
            <label className="settings-label">자동 Git 커밋</label>
            <p className="settings-hint">
              변경 사항을 자동으로 Git에 커밋합니다.
            </p>
          </div>
          <Switch
            checked={projectSettings?.autoGitCommit ?? true}
            onChange={(e) => updateProjectSettings({ autoGitCommit: e.currentTarget.checked })}
            classNames={{
              track: 'settings-switch-track',
            }}
          />
        </Group>
      </div>
    </div>
  );
}
