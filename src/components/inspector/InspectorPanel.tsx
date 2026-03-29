import { Box, Text, Select, TextInput, Textarea, Loader, ActionIcon, NumberInput, Tooltip } from '@mantine/core';
import { IconX, IconSquare, IconSparkles, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
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
  const deletePanel = useProjectStore(s => s.deletePanel);
  const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
  const addNotification = useUIStore(s => s.addNotification);
  const currentProjectPath = useWorkspaceStore(s => s.currentProjectPath);
  const { generatePanel, generateDescriptionSuggestion } = useClaude();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        <ActionIcon
          variant="subtle"
          onClick={toggleRightSidebar}
          style={{ marginLeft: 'auto', background: 'transparent' }}
        >
          <IconX size={14} stroke={1.5} />
        </ActionIcon>
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
            <Box mb={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                Panel {panel.number}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => deletePanel(panel.id)}
                title="패널 삭제"
              >
                <IconTrash size={14} stroke={1.5} />
              </ActionIcon>
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
                      label: o.value,
                      description: o.description,
                    }))}
                    placeholder="선택"
                    size="sm"
                    clearable
                    renderOption={({ option }) => (
                      <Tooltip
                        label={(option as any).description}
                        position="left"
                        withArrow
                        withinPortal
                      >
                        <Text size="sm">{option.label}</Text>
                      </Tooltip>
                    )}
                  />
                </Box>
                <Box className="insp-field">
                  <label htmlFor="duration">지속 시간</label>
                  <NumberInput
                    id="duration"
                    value={panel.duration ? parseFloat(panel.duration) : undefined}
                    onChange={(value) =>
                      updatePanel(panel.id, { duration: value ? `${value}s` : '' })
                    }
                    placeholder="3"
                    min={0.5}
                    max={60}
                    step={0.5}
                    size="sm"
                    rightSection={<Text size="xs" c="dimmed">초</Text>}
                    rightSectionWidth={36}
                    decimalScale={1}
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

            {/* Image */}
            <Box className="insp-section">
              <Text className="insp-sec-label">이미지</Text>

              {/* Preview */}
              {(panel.svgData || panel.imageData) && (
                <Box
                  style={{
                    marginBottom: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'var(--bg2)',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {panel.svgData ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: panel.svgData }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <img
                      src={panel.imageData!}
                      alt="Panel preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  )}
                </Box>
              )}

              <Box className="insp-field">
                <Box style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={async () => {
                      if (!currentProjectPath) {
                        addNotification('error', '프로젝트를 먼저 저장해주세요');
                        return;
                      }

                      const selected = await open({
                        multiple: false,
                        filters: [{ name: 'Images', extensions: ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'] }],
                      });

                      if (selected && typeof selected === 'string') {
                        setIsUploading(true);
                        try {
                          const fileData = await readFile(selected);
                          const fileName = selected.split('/').pop() || 'image';
                          const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';

                          // Ensure assets folder exists
                          const assetsPath = `${currentProjectPath}/assets`;
                          const assetsExists = await exists(assetsPath);
                          if (!assetsExists) {
                            await mkdir(assetsPath, { recursive: true });
                          }

                          // Generate unique filename
                          const timestamp = Date.now();
                          const uniqueName = `panel-${panel.number}-${timestamp}.${ext}`;
                          const destPath = `${assetsPath}/${uniqueName}`;

                          // Copy file to assets folder
                          await writeFile(destPath, fileData);

                          // Determine how to store based on file type
                          if (ext === 'svg') {
                            const decoder = new TextDecoder();
                            const svgContent = decoder.decode(fileData);
                            updatePanel(panel.id, {
                              svgData: svgContent,
                              imagePath: `assets/${uniqueName}`,
                              imageData: null,
                            });
                          } else {
                            // For raster images, create base64 data URL
                            const mimeType = ext === 'png' ? 'image/png'
                              : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                              : ext === 'gif' ? 'image/gif'
                              : ext === 'webp' ? 'image/webp'
                              : 'application/octet-stream';
                            const base64 = btoa(String.fromCharCode(...fileData));
                            const dataUrl = `data:${mimeType};base64,${base64}`;
                            updatePanel(panel.id, {
                              imageData: dataUrl,
                              imagePath: `assets/${uniqueName}`,
                              svgData: null,
                            });
                          }

                          addNotification('info', '이미지가 추가되었습니다');
                        } catch (err) {
                          console.error('Failed to upload image:', err);
                          addNotification('error', '이미지 업로드 실패');
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                    disabled={isUploading}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {isUploading ? (
                      <Loader size={12} color="var(--accent)" />
                    ) : (
                      <>
                        <IconUpload size={12} stroke={1.5} />
                        파일에서 불러오기
                      </>
                    )}
                  </button>

                  {(panel.svgData || panel.imageData) && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        updatePanel(panel.id, { svgData: null, imageData: null, imagePath: null });
                      }}
                      title="이미지 삭제"
                    >
                      <IconTrash size={12} stroke={1.5} />
                    </button>
                  )}
                </Box>
              </Box>
            </Box>

            {/* AI */}
            <Box className="insp-section">
              <Text className="insp-sec-label">AI</Text>
              <button
                className="btn btn-accent"
                onClick={handleRegenerate}
                disabled={!panel.description.trim() || isRegenerating}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                {isRegenerating ? (
                  <Loader size={12} color="var(--accent)" />
                ) : (
                  <>
                    <IconSparkles size={12} stroke={1.5} />
                    이 패널 AI 재생성
                  </>
                )}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleAutoEnhance}
                disabled={!panel.description.trim() || isEnhancing}
                style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              >
                {isEnhancing ? (
                  <Loader size={12} color="var(--accent)" />
                ) : (
                  <>
                    <IconSparkles size={12} stroke={1.5} />
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
