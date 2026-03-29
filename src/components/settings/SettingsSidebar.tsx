import { IconBrain, IconPalette, IconFolder, IconEdit, IconKeyboard } from '@tabler/icons-react';

export type SettingsTab = 'ai' | 'appearance' | 'project' | 'editor' | 'shortcuts';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string; icon: typeof IconBrain }[] = [
  { id: 'ai', label: 'AI', icon: IconBrain },
  { id: 'appearance', label: '외관', icon: IconPalette },
  { id: 'project', label: '프로젝트', icon: IconFolder },
  { id: 'editor', label: '에디터', icon: IconEdit },
  { id: 'shortcuts', label: '단축키', icon: IconKeyboard },
];

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="settings-sidebar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
