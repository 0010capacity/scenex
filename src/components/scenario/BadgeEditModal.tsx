import { useState, useEffect } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { BadgeType, BadgeClickInfo } from './scenarioDecorators';

interface BadgeEditModalProps {
  opened: boolean;
  onClose: () => void;
  badgeInfo: BadgeClickInfo | null;
  onSave: (badgeInfo: BadgeClickInfo, newContent: string) => void;
}

// Parse slugline into components
function parseSlugline(text: string): { locationType: string; location: string; timeOfDay: string } {
  const match = text.match(/^(INT|EXT)\.\s*(.+?)\s*[-—]\s*(.+)$/i);
  if (match) {
    return {
      locationType: match[1].toUpperCase(),
      location: match[2].trim(),
      timeOfDay: match[3].trim(),
    };
  }
  return { locationType: 'INT', location: '', timeOfDay: 'DAY' };
}

// Get user-friendly modal title for badge type
function getModalTitle(type: BadgeType): string {
  const titles: Record<BadgeType, string> = {
    TITLE: '제목 수정',
    ACT: '대단원 수정',
    SLUG: '장면 위치 수정',
    SCENE: '소단위 수정',
    NOTE: '노트 수정',
    GENRE: '장르 수정',
    MOOD: '분위기 수정',
  };
  return titles[type];
}

export function BadgeEditModal({ opened, onClose, badgeInfo, onSave }: BadgeEditModalProps) {
  const [textContent, setTextContent] = useState('');
  const [slugData, setSlugData] = useState({
    locationType: 'INT',
    location: '',
    timeOfDay: 'DAY',
  });

  // Reset state when modal opens with new badge info
  useEffect(() => {
    if (badgeInfo) {
      const content = badgeInfo.lineText.replace(/^#+\s*/, '').replace(/^>\s*/, '');
      setTextContent(content);

      if (badgeInfo.badgeType === 'SLUG') {
        const parsed = parseSlugline(content);
        setSlugData(parsed);
      }
    }
  }, [badgeInfo]);

  const handleSave = () => {
    if (!badgeInfo) return;

    let newContent: string;

    if (badgeInfo.badgeType === 'SLUG') {
      // Reconstruct slugline
      newContent = `${slugData.locationType}. ${slugData.location} - ${slugData.timeOfDay}`;
    } else if (badgeInfo.badgeType === 'NOTE') {
      // Note format: > text
      newContent = textContent;
    } else {
      // Heading formats
      newContent = textContent;
    }

    onSave(badgeInfo, newContent);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!opened || !badgeInfo) return null;

  const isSlug = badgeInfo.badgeType === 'SLUG';

  return (
    <div className={`modal-backdrop ${opened ? 'open' : ''}`} onClick={handleBackdropClick}>
      <div className="ap-modal" style={{ width: 420 }}>
        <div className="ap-header">
          <span style={{ fontSize: 14, fontWeight: 500 }}>{getModalTitle(badgeInfo.badgeType)}</span>
          <ActionIcon variant="subtle" onClick={handleCancel}>
            <IconX size={16} stroke={1.5} />
          </ActionIcon>
        </div>
        <div className="ap-body">
          {isSlug ? (
            // Slugline editor with separate fields
            <>
              <div className="bo-field">
                <label>위치 유형</label>
                <select
                  value={slugData.locationType}
                  onChange={(e) => setSlugData((d) => ({ ...d, locationType: e.target.value }))}
                >
                  <option value="INT">INT. (실내)</option>
                  <option value="EXT">EXT. (실외)</option>
                </select>
              </div>
              <div className="bo-field">
                <label>장소</label>
                <input
                  type="text"
                  placeholder="예: COFFEE SHOP"
                  value={slugData.location}
                  onChange={(e) => setSlugData((d) => ({ ...d, location: e.target.value }))}
                />
              </div>
              <div className="bo-field">
                <label>시간대</label>
                <select
                  value={slugData.timeOfDay}
                  onChange={(e) => setSlugData((d) => ({ ...d, timeOfDay: e.target.value }))}
                >
                  <option value="DAY">DAY (낮)</option>
                  <option value="NIGHT">NIGHT (밤)</option>
                  <option value="DAWN">DAWN (새벽)</option>
                  <option value="DUSK">DUSK (황혼)</option>
                  <option value="LATER">LATER (나중에)</option>
                  <option value="CONTINUOUS">CONTINUOUS (계속)</option>
                </select>
              </div>
            </>
          ) : (
            // Simple text editor for other badge types
            <div className="bo-field">
              <label>내용</label>
              <input
                type="text"
                placeholder={
                  badgeInfo.badgeType === 'TITLE'
                    ? '시나리오 제목'
                    : badgeInfo.badgeType === 'ACT'
                      ? '대단원 이름'
                      : badgeInfo.badgeType === 'SCENE'
                        ? '소단위 이름'
                        : badgeInfo.badgeType === 'GENRE'
                          ? '장르 (예: fantasy, thriller)'
                          : badgeInfo.badgeType === 'MOOD'
                            ? '분위기 (예: dark, bright)'
                            : '노트 내용'
                }
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          )}
        </div>
        <div className="ap-footer">
          <button className="btn btn-outline" onClick={handleCancel}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
