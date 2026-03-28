import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import type { EditorView } from '@codemirror/view';

export interface SluglineValues {
  type: 'INT' | 'EXT';
  location: string;
  time: string;
}

export interface SluglineHelperProps {
  position: { top: number; left: number };
  onInsert: (slugline: string) => void;
  onClose: () => void;
}

const TIME_OPTIONS = [
  { value: 'DAY', label: 'DAY' },
  { value: 'NIGHT', label: 'NIGHT' },
  { value: 'MORNING', label: 'MORNING' },
  { value: 'AFTERNOON', label: 'AFTERNOON' },
  { value: 'EVENING', label: 'EVENING' },
  { value: 'DUSK', label: 'DUSK' },
  { value: 'DAWN', label: 'DAWN' },
  { value: 'CONTINUOUS', label: 'CONTINUOUS' },
  { value: 'LATER', label: 'LATER' },
  { value: 'MOMENTS LATER', label: 'MOMENTS LATER' },
];

export function SluglineHelper({ position, onInsert, onClose }: SluglineHelperProps) {
  const [type, setType] = useState<'INT' | 'EXT'>('INT');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('DAY');
  const ref = useRef<HTMLDivElement>(null);

  const preview = location.trim()
    ? `${type}. ${location.trim().toUpperCase()} — ${time}`
    : `${type}. _________ — ${time}`;

  const handleInsert = useCallback(() => {
    if (location.trim()) {
      const slugline = `### ${preview}`;
      onInsert(slugline);
    }
  }, [location, preview, onInsert]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && location.trim()) {
        handleInsert();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleInsert, location]);

  return (
    <Box
      ref={ref}
      className="slugline-helper"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r8)',
        padding: '16px',
        width: '320px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '14px',
          letterSpacing: '0.02em',
        }}
      >
        새 씬
      </Text>

      {/* Type selection */}
      <Box style={{ marginBottom: '12px' }}>
        <Text
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text3)',
            marginBottom: '6px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          유형
        </Text>
        <Box style={{ display: 'flex', gap: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text2)',
            }}
          >
            <input
              type="radio"
              name="slug-type"
              value="INT"
              checked={type === 'INT'}
              onChange={() => setType('INT')}
              style={{ accentColor: 'var(--accent)' }}
            />
            실내 (INT.)
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text2)',
            }}
          >
            <input
              type="radio"
              name="slug-type"
              value="EXT"
              checked={type === 'EXT'}
              onChange={() => setType('EXT')}
              style={{ accentColor: 'var(--accent)' }}
            />
            실외 (EXT.)
          </label>
        </Box>
      </Box>

      {/* Location input */}
      <Box style={{ marginBottom: '12px' }}>
        <Text
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text3)',
            marginBottom: '6px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          장소
        </Text>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="예: 연구실, 건물 앞"
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            padding: '8px 10px',
            color: 'var(--text)',
            fontSize: '12px',
            fontFamily: 'var(--sans)',
            outline: 'none',
            transition: 'border 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border2)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </Box>

      {/* Time selection */}
      <Box style={{ marginBottom: '14px' }}>
        <Text
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text3)',
            marginBottom: '6px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          시간
        </Text>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            padding: '8px 10px',
            color: 'var(--text)',
            fontSize: '12px',
            fontFamily: 'var(--sans)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Box>

      {/* Preview */}
      <Box
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r4)',
          padding: '8px 10px',
          marginBottom: '14px',
        }}
      >
        <Text
          style={{
            fontSize: '10px',
            color: 'var(--text3)',
            marginBottom: '4px',
            letterSpacing: '0.04em',
          }}
        >
          미리보기
        </Text>
        <Text
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--gold)',
            fontWeight: 500,
          }}
        >
          {preview}
        </Text>
      </Box>

      {/* Actions */}
      <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text2)',
            padding: '6px 12px',
            borderRadius: 'var(--r4)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border2)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text2)';
          }}
        >
          취소
        </button>
        <button
          onClick={handleInsert}
          disabled={!location.trim()}
          style={{
            background: location.trim() ? 'var(--accent)' : 'var(--bg3)',
            border: 'none',
            color: location.trim() ? '#fff' : 'var(--text3)',
            padding: '6px 14px',
            borderRadius: 'var(--r4)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: location.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          삽입
        </button>
      </Box>
    </Box>
  );
}

// Hook to manage slugline helper state and positioning
export function useSluglineHelper(
  viewRef: React.RefObject<EditorView | null>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const openHelper = useCallback((coords: { top: number; left: number }) => {
    setPosition(coords);
    setIsOpen(true);
  }, []);

  const closeHelper = useCallback(() => {
    setIsOpen(false);
  }, []);

  const insertSlugline = useCallback(
    (slugline: string) => {
      const view = viewRef.current;
      if (view) {
        const { from } = view.state.selection.main;
        view.dispatch({
          changes: { from, insert: slugline + '\n\n' },
          selection: { anchor: from + slugline.length + 2 },
        });
        view.focus();
      }
      setIsOpen(false);
    },
    [viewRef]
  );

  return {
    isOpen,
    position,
    openHelper,
    closeHelper,
    insertSlugline,
  };
}
