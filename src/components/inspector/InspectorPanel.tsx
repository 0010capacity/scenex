import { Box, Text, Select, TextInput, Textarea, Loader } from '@mantine/core';
import { IconX, IconSquare, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';
import {
  SHOT_TYPE_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
  TRANSITION_OPTIONS,
  MOOD_LABELS,
  MoodTag,
} from '@/types';

export function InspectorPanel() {
  const getSelectedPanel = useProjectStore(s => s.getSelectedPanel);
  const updatePanel = useProjectStore(s => s.updatePanel);
  const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
  const addNotification = useUIStore(s => s.addNotification);
  const { generatePanel, generateDescriptionSuggestion } = useClaude();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const panel = getSelectedPanel();

  const handleRegenerate = async () => {
    if (!panel?.description.trim()) return;
    setIsRegenerating(true);
    try {
      const result = await generatePanel(panel.description, panel.shotType ?? undefined, panel.moodTags);
      if (result.success && result.svg_data) {
        updatePanel(panel.id, { svgData: result.svg_data });
        addNotification('info', '패널이 AI로 재생성되었습니다');
      } else if (result.error) {
        console.error('AI regeneration failed:', result.error);
        addNotification('error', `AI 재생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('AI regeneration failed:', error);
      addNotification('error', `AI 재생성 실패: ${error}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAutoEnhance = async () => {
    if (!panel?.description.trim()) return;
    setIsEnhancing(true);
    try {
      const result = await generateDescriptionSuggestion(panel.description);
      if (result.success && result.suggestion) {
        updatePanel(panel.id, { description: result.suggestion });
        addNotification('info', '설명이 자동 완성되었습니다');
      } else if (result.error) {
        console.error('Auto-enhance failed:', result.error);
        addNotification('error', `설명 자동 완성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Auto-enhance failed:', error);
      addNotification('error', `설명 자동 완성 실패: ${error}`);
    } finally {
      setIsEnhancing(false);
    }
  };

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
                  <label htmlFor="shot-type">샷 타입</label>
                  <Select
                    id="shot-type"
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
                  <label htmlFor="duration">지속 시간</label>
                  <TextInput
                    id="duration"
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
                <label htmlFor="camera-movement">카메라 무브먼트</label>
                <Select
                  id="camera-movement"
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
                <label htmlFor="description">장면 설명</label>
                <Textarea
                  id="description"
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
                <label htmlFor="dialogue">대사 / 나레이션</label>
                <TextInput
                  id="dialogue"
                  value={panel.dialogue}
                  onChange={(e) =>
                    updatePanel(panel.id, { dialogue: e.currentTarget.value })
                  }
                  placeholder="없음"
                  size="sm"
                />
              </Box>
              <Box className="insp-field">
                <label htmlFor="sound">사운드</label>
                <TextInput
                  id="sound"
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
                <label htmlFor="transition" className="sr-only">전환 효과</label>
                <Select
                  id="transition"
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
                onClick={handleRegenerate}
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
                onClick={handleAutoEnhance}
                disabled={!panel.description.trim() || isEnhancing}
              >
                {isEnhancing ? (
                  <Loader size={12} color="var(--accent)" />
                ) : (
                  <>
                    <IconSparkles size={12} stroke={1.5} style={{ marginRight: 4 }} />
                    설명 자동 완성
                  </>
                )}
              </button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
