import { useState } from 'react';
import { Modal } from '@mantine/core';
import { SettingsSidebar, SettingsTab } from './SettingsSidebar';
import { AISection } from './AISection';
import { AppearanceSection } from './AppearanceSection';
import { ProjectSection } from './ProjectSection';
import { EditorSection } from './EditorSection';
import { ShortcutsSection } from './ShortcutsSection';
import { useUIStore } from '@/stores/uiStore';

export function SettingsModal() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const { settingsModalOpen, closeSettingsModal } = useUIStore();

  const renderSection = () => {
    switch (activeTab) {
      case 'ai':
        return <AISection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'project':
        return <ProjectSection />;
      case 'editor':
        return <EditorSection />;
      case 'shortcuts':
        return <ShortcutsSection />;
      default:
        return <AISection />;
    }
  };

  return (
    <Modal
      opened={settingsModalOpen}
      onClose={closeSettingsModal}
      title="설정"
      size="lg"
      padding={0}
      classNames={{
        content: 'settings-modal',
        header: 'settings-modal-header',
        title: 'settings-modal-title',
        body: 'settings-modal-body',
      }}
    >
      <div className="settings-modal-content">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-content">{renderSection()}</div>
      </div>
    </Modal>
  );
}
