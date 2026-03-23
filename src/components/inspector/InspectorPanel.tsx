import { Box, Text, Select, TextInput, Textarea, Loader } from '@mantine/core';
import { IconX, IconSquare, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  SHOT_TYPE_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
  TRANSITION_OPTIONS,
  MoodTag,
} from '@/types';

const MOOD_LABELS: Record<MoodTag, string> = {
  emotional: '감성적',
  golden: '황금빛',
  tension: '긴장감',
  humor: '유머',
  excitement: '설렘',
  sadness: '슬픔',
};

export function InspectorPanel() {
  const { getSelectedPanel, updatePanel } = useProjectStore();
  const { toggleRightSidebar } = useUIStore();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const panel = getSelectedPanel();

  return (
    <Box
      style={{
        height: '100%',
        backgroundColor: 'var(--bg1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
          }}
        >
          속성
        </Text>
        <button
          onClick={toggleRightSidebar}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
            cursor: 'pointer',
            fontSize: 13,
            padding: '2px 4px',
            borderRadius: 3,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
        >
          <IconX size={14} stroke={1.5} />
        </button>
      </Box>

      {/* Body */}
      <Box style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {!panel ? (
          /* Empty state */
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              gap: 8,
              textAlign: 'center',
              height: '100%',
            }}
          >
            <IconSquare size={20} color="var(--text3)" stroke={1.5} />
            <Text style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              패널을 선택하면
              <br />
              속성을 편집할 수 있어요
            </Text>
          </Box>
        ) : (
          <>
            {/* Panel number header */}
            <Box mb={16}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                Panel {panel.number}
              </Text>
            </Box>

            {/* Shot Settings */}
            <Box className="insp-section">
              <Text className="insp-sec-label">프레임</Text>
              <Box className="insp-row">
                <Box className="insp-field">
                  <label>샷 타입</label>
                  <Select
                    value={panel.shotType ?? null}
                    onChange={(value) =>
                      updatePanel(panel.id, { shotType: value as any })
                    }
                    data={SHOT_TYPE_OPTIONS.map((o) => ({
                      value: o.value,
                      label: `${o.value} — ${o.description}`,
                    }))}
                    placeholder="선택"
                    size="sm"
                    clearable
                  />
                </Box>
                <Box className="insp-field">
                  <label>지속 시간</label>
                  <TextInput
                    value={panel.duration}
                    onChange={(e) =>
                      updatePanel(panel.id, { duration: e.currentTarget.value })
                    }
                    placeholder="예: 3s"
                    size="sm"
                  />
                </Box>
              </Box>
              <Box className="insp-field">
                <label>카메라 무브먼트</label>
                <Select
                  value={panel.cameraMovement ?? null}
                  onChange={(value) =>
                    updatePanel(panel.id, { cameraMovement: value as any })
                  }
                  data={CAMERA_MOVEMENT_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  placeholder="선택"
                  size="sm"
                  clearable
                />
              </Box>
            </Box>

            {/* Description */}
            <Box className="insp-section">
              <Text className="insp-sec-label">내용</Text>
              <Box className="insp-field">
                <label>장면 설명</label>
                <Textarea
                  value={panel.description}
                  onChange={(e) =>
                    updatePanel(panel.id, { description: e.currentTarget.value })
                  }
                  placeholder="이 프레임에서 무슨 일이 일어나나요?"
                  minRows={3}
                  maxRows={6}
                  size="sm"
                />
              </Box>
              <Box className="insp-field">
                <label>대사 / 나레이션</label>
                <TextInput
                  value={panel.dialogue}
                  onChange={(e) =>
                    updatePanel(panel.id, { dialogue: e.currentTarget.value })
                  }
                  placeholder="없음"
                  size="sm"
                />
              </Box>
              <Box className="insp-field">
                <label>사운드</label>
                <TextInput
                  value={panel.sound}
                  onChange={(e) =>
                    updatePanel(panel.id, { sound: e.currentTarget.value })
                  }
                  placeholder="없음"
                  size="sm"
                />
              </Box>
            </Box>

            {/* Mood Tags */}
            <Box className="insp-section">
              <Text className="insp-sec-label">분위기</Text>
              <Box className="mood-tags">
                {(Object.keys(MOOD_LABELS) as MoodTag[]).map((tag) => (
                  <Box
                    key={tag}
                    className={`mood-tag ${panel.moodTags.includes(tag) ? 'on' : ''}`}
                    onClick={() => {
                      const newTags = panel.moodTags.includes(tag)
                        ? panel.moodTags.filter((t) => t !== tag)
                        : [...panel.moodTags, tag];
                      updatePanel(panel.id, { moodTags: newTags });
                    }}
                    style={
                      panel.moodTags.includes(tag)
                        ? {
                            background: 'var(--accent-dim)',
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                          }
                        : {}
                    }
                  >
                    {MOOD_LABELS[tag]}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Transition */}
            <Box className="insp-section">
              <Text className="insp-sec-label">전환</Text>
              <Box className="insp-field">
                <Select
                  value={panel.transition}
                  onChange={(value) =>
                    updatePanel(panel.id, { transition: value as any })
                  }
                  data={TRANSITION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  size="sm"
                />
              </Box>
            </Box>

            {/* AI */}
            <Box className="insp-section">
              <Text className="insp-sec-label">AI</Text>
              <button
                className="insp-ai-btn"
                onClick={() => {
                  if (!panel.description.trim()) return;
                  setIsRegenerating(true);
                  setTimeout(() => setIsRegenerating(false), 2000);
                }}
                disabled={!panel.description.trim() || isRegenerating}
              >
                {isRegenerating ? (
                  <Loader size={12} color="var(--accent)" />
                ) : (
                  <>
                    <IconSparkles size={12} stroke={1.5} style={{ marginRight: 4 }} />
                    이 패널 AI 재생성
                  </>
                )}
              </button>
              <button
                className="insp-ai-btn secondary"
                onClick={() => {
                  // Auto-enhance description
                }}
              >
                <IconSparkles size={12} stroke={1.5} style={{ marginRight: 4 }} />
                설명 자동 완성
              </button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
