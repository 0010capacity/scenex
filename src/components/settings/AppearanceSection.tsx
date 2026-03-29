import { SegmentedControl, Slider } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

export function AppearanceSection() {
  const { settings, updateAppearanceSettings } = useSettingsStore();

  const appearanceSettings = settings?.appearance;

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label">테마</label>
        <SegmentedControl
          value={appearanceSettings?.theme || 'system'}
          onChange={(value) => updateAppearanceSettings({ theme: value as 'light' | 'dark' | 'system' })}
          data={[
            { label: '라이트', value: 'light' },
            { label: '다크', value: 'dark' },
            { label: '시스템', value: 'system' },
          ]}
          classNames={{
            root: 'settings-segmented',
          }}
        />
      </div>

      <div className="settings-field">
        <label className="settings-label">글꼴 크기</label>
        <Slider
          value={appearanceSettings?.fontSize || 14}
          onChange={(value) => updateAppearanceSettings({ fontSize: value })}
          min={12}
          max={20}
          step={1}
          marks={[
            { value: 12, label: '12' },
            { value: 14, label: '14' },
            { value: 16, label: '16' },
            { value: 18, label: '18' },
            { value: 20, label: '20' },
          ]}
          classNames={{
            root: 'settings-slider',
          }}
        />
      </div>
    </div>
  );
}
