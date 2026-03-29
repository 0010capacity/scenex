import { useState } from 'react';
import { TextInput, Button } from '@mantine/core';
import { useSettingsStore } from '@/stores/settingsStore';

interface Shortcut {
  id: string;
  category: string;
  label: string;
  defaultShortcut: string;
  customShortcut?: string;
  conflicts?: boolean;
}

const defaultShortcuts: Shortcut[] = [
  // File
  { id: 'new-project', category: 'File', label: '새 프로젝트', defaultShortcut: '⌘N' },
  { id: 'open-project', category: 'File', label: '프로젝트 열기', defaultShortcut: '⌘O' },
  { id: 'save-project', category: 'File', label: '저장', defaultShortcut: '⌘S' },
  { id: 'export', category: 'File', label: '내보내기', defaultShortcut: '⌘E' },

  // Edit
  { id: 'undo', category: 'Edit', label: '실행 취소', defaultShortcut: '⌘Z' },
  { id: 'redo', category: 'Edit', label: '다시 실행', defaultShortcut: '⌘⇧Z' },
  { id: 'cut', category: 'Edit', label: '잘라내기', defaultShortcut: '⌘X' },
  { id: 'copy', category: 'Edit', label: '복사', defaultShortcut: '⌘C' },
  { id: 'paste', category: 'Edit', label: '붙여넣기', defaultShortcut: '⌘V' },

  // View
  { id: 'toggle-sidebar', category: 'View', label: '사이드바 토글', defaultShortcut: '⌘\\' },
  { id: 'toggle-copilot', category: 'View', label: 'Copilot 토글', defaultShortcut: '⌘/' },
  { id: 'zoom-in', category: 'View', label: '확대', defaultShortcut: '⌘+' },
  { id: 'zoom-out', category: 'View', label: '축소', defaultShortcut: '⌘-' },
  { id: 'reset-zoom', category: 'View', label: '줌 초기화', defaultShortcut: '⌘0' },
];

export function ShortcutsSection() {
  const [search, setSearch] = useState('');
  const { settings, resetShortcuts } = useSettingsStore();

  const customShortcuts = settings?.shortcuts?.customShortcuts || {};

  // Merge default shortcuts with custom ones
  const shortcuts: Shortcut[] = defaultShortcuts.map((s) => ({
    ...s,
    customShortcut: customShortcuts[s.id],
  }));

  const categories = ['File', 'Edit', 'View'];

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleResetAll = async () => {
    await resetShortcuts();
  };

  return (
    <div className="settings-section">
      <div className="shortcuts-header">
        <TextInput
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          classNames={{
            input: 'settings-search',
          }}
          w={200}
        />
        <Button
          variant="outline"
          size="xs"
          onClick={handleResetAll}
          className="btn-outline btn-sm"
        >
          초기화
        </Button>
      </div>

      <div className="shortcuts-list">
        {categories.map((category) => {
          const categoryShortcuts = filteredShortcuts.filter(
            (s) => s.category === category
          );
          if (categoryShortcuts.length === 0) return null;

          return (
            <div key={category} className="shortcuts-category">
              <h3 className="shortcuts-category-title">{category}</h3>
              {categoryShortcuts.map((shortcut) => (
                <div key={shortcut.id} className="shortcut-row">
                  <span className="shortcut-label">{shortcut.label}</span>
                  <span
                    className={`shortcut-key ${
                      shortcut.conflicts ? 'shortcut-conflict' : ''
                    }`}
                  >
                    {shortcut.customShortcut || shortcut.defaultShortcut}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
