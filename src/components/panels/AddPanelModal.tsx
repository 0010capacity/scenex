import { Box, Text, Select, Button, Loader } from '@mantine/core';
import { IconSquare, IconDownload, IconSparkles, IconX, IconArrowLeft } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useClaude } from '@/hooks/useClaude';
import { SHOT_TYPE_OPTIONS, MOOD_TAG_OPTIONS, MoodTag } from '@/types';

type AddMethod = 'blank' | 'import' | 'ai' | null;

interface AddPanelModalProps {
  opened: boolean;
  onClose: () => void;
  sceneId: string | null;
}

export function AddPanelModal({ opened, onClose, sceneId }: AddPanelModalProps) {
  const { addPanel, project } = useProjectStore();
  const { addNotification } = useUIStore();
  const { generatePanel } = useClaude();
  const [selectedMethod, setSelectedMethod] = useState<AddMethod>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Blank form
  const [shotType, setShotType] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [dialogue, setDialogue] = useState('');
  const [sound, setSound] = useState('');
  const [moodTags, setMoodTags] = useState<MoodTag[]>([]);

  // AI form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiShotHint, setAiShotHint] = useState<string | null>(null);
  const [aiDuration, setAiDuration] = useState('');

  // Import form
  const [importedImage, setImportedImage] = useState<string | null>(null);
  const [importShotType, setImportShotType] = useState<string | null>(null);
  const [importDuration, setImportDuration] = useState('');
  const [importDescription, setImportDescription] = useState('');

  useEffect(() => {
    if (!opened) {
      setSelectedMethod(null);
      setShotType(null);
      setDuration('');
      setDescription('');
      setDialogue('');
      setSound('');
      setMoodTags([]);
      setAiPrompt('');
      setAiShotHint(null);
      setAiDuration('');
      setImportedImage(null);
      setImportShotType(null);
      setImportDuration('');
      setImportDescription('');
    }
  }, [opened]);

  if (!opened) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleMethodSelect = (method: AddMethod) => {
    setSelectedMethod(method);
  };

  const handleFileSelect = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'psd', 'pdf'] }],
      });
      if (file) {
        const data = await readFile(file as string);
        const ext = (file as string).split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/png';
        const base64 = btoa(String.fromCharCode(...data));
        setImportedImage(`data:${mimeType};base64,${base64}`);
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      addNotification('error', `파일 읽기 실패: ${error}`);
    }
  };

  const handleConfirm = async () => {
    if (!sceneId || !selectedMethod) return;

    const scene = project?.scenes.find((s) => s.id === sceneId);
    const panelNumber = scene ? scene.panels.length + 1 : 1;

    if (selectedMethod === 'blank') {
      addPanel(sceneId, {
        number: panelNumber,
        shotType: shotType as any,
        duration: duration || '3s',
        description,
        dialogue,
        sound,
        moodTags,
        sourceType: 'empty',
      });
      onClose();
    } else if (selectedMethod === 'ai') {
      // AI generation - first add a temporary panel, then generate SVG
      setIsGenerating(true);
      try {
        // Create panel first with basic info
        addPanel(sceneId, {
          number: panelNumber,
          shotType: aiShotHint as any,
          duration: aiDuration || '3s',
          description: aiPrompt,
          sourceType: 'ai',
          moodTags,
          svgData: null, // Will be filled after AI generation
        });

        // Call AI to generate SVG
        const result = await generatePanel(aiPrompt, aiShotHint ?? undefined, moodTags);
        if (result.success && result.svg_data) {
          // Update panel with generated SVG
          // The panel was just added, we need to find it and update it
          const updatedScene = project?.scenes.find((s) => s.id === sceneId);
          const createdPanel = updatedScene?.panels.find((p) => p.description === aiPrompt && !p.svgData);
          if (createdPanel) {
            useProjectStore.getState().updatePanel(createdPanel.id, { svgData: result.svg_data });
          }
          addNotification('info', 'AI 패널이 생성되었습니다');
        } else if (result.error) {
          console.error('AI panel generation failed:', result.error);
          addNotification('error', `AI 패널 생성 실패: ${result.error}`);
        }
      } catch (error) {
        console.error('AI panel generation failed:', error);
        addNotification('error', `AI 패널 생성 실패: ${error}`);
      } finally {
        setIsGenerating(false);
        onClose();
      }
    } else if (selectedMethod === 'import') {
      addPanel(sceneId, {
        number: panelNumber,
        shotType: importShotType as any,
        duration: importDuration || '3s',
        description: importDescription,
        imageData: importedImage,
        sourceType: 'imported',
      });
      onClose();
    }
  };

  const getConfirmLabel = () => {
    if (!selectedMethod) return '방식을 선택하세요';
    if (selectedMethod === 'blank') return '빈 패널 추가';
    if (selectedMethod === 'import') return importedImage ? '가져오기 완료' : '파일 선택 후 추가';
    if (selectedMethod === 'ai') return isGenerating ? '생성 중...' : '✦ AI 생성 후 추가';
    return '패널 추가';
  };

  return (
    <Box className={`modal-backdrop open`} onClick={handleBackdropClick}>
      <Box className="ap-modal">
        {/* Header */}
        <Box className="ap-header">
          <Text style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
            패널 추가
          </Text>
          <button
            className="ap-close"
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
          >
            <IconX size={16} stroke={1.5} />
          </button>
        </Box>

        {/* Body */}
        <Box className="ap-body">
          {/* Method cards */}
          {!selectedMethod ? (
            <>
              {/* Blank */}
              <Box className="method-card mc-blank" onClick={() => handleMethodSelect('blank')}>
                <Box className="method-icon"><IconSquare size={16} stroke={1.5} /></Box>
                <Box className="method-text">
                  <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', mb: 3 }}>
                    빈 패널
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                    빈 프레임으로 시작합니다. 텍스트로 설명을 직접 입력하거나 나중에 이미지를 추가할 수 있어요.
                  </Text>
                </Box>
              </Box>

              {/* Import */}
              <Box className="method-card mc-import" onClick={() => handleMethodSelect('import')}>
                <Box className="method-icon"><IconDownload size={16} stroke={1.5} /></Box>
                <Box className="method-text">
                  <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', mb: 3 }}>
                    이미지 임포트
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                    JPG, PNG, PSD, PDF 등 외부 이미지를 패널로 가져옵니다. 직접 그린 스케치도 OK.
                  </Text>
                </Box>
              </Box>

              {/* AI */}
              <Box className="method-card mc-ai" onClick={() => handleMethodSelect('ai')}>
                <Box className="method-icon"><IconSparkles size={16} stroke={1.5} /></Box>
                <Box className="method-text">
                  <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', mb: 3 }}>
                    AI 생성
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                    설명을 입력하면 Claude가 이 패널에 맞는 스토리보드 설명과 카메라 설정을 자동으로 생성해요.
                  </Text>
                </Box>
              </Box>
            </>
          ) : (
            <>
              {/* Back button */}
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setSelectedMethod(null)}
                style={{ color: 'var(--text3)', alignSelf: 'flex-start', marginBottom: 4 }}
              >
                <IconArrowLeft size={14} stroke={1.5} style={{ marginRight: 4 }} />
                뒤로
              </Button>

              {/* Blank options */}
              {selectedMethod === 'blank' && (
                <Box className="blank-options show">
                  <Box className="bo-row">
                    <Box className="bo-field">
                      <label>샷 타입</label>
                      <Select
                        value={shotType}
                        onChange={setShotType}
                        data={SHOT_TYPE_OPTIONS.map((o) => ({
                          value: o.value,
                          label: `${o.value} — ${o.description}`,
                        }))}
                        placeholder="지정 안 함"
                        size="sm"
                        clearable
                      />
                    </Box>
                    <Box className="bo-field">
                      <label>지속 시간</label>
                      <input
                        className="bo-field input"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="예: 3s"
                        style={{ width: '100%', padding: '6px 9px', fontSize: 12 }}
                      />
                    </Box>
                  </Box>
                  <Box className="bo-field">
                    <label>장면 설명 <span style={{ color: 'var(--text3)', fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>(선택 사항)</span></label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="이 프레임에서 무슨 일이 일어나나요?"
                      rows={2}
                      style={{
                        width: '100%',
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        padding: '6px 9px',
                        borderRadius: 'var(--r4)',
                        fontSize: 12,
                        fontFamily: 'var(--sans)',
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.5,
                      }}
                    />
                  </Box>
                  <Box className="bo-row">
                    <Box className="bo-field">
                      <label>대사</label>
                      <input
                        value={dialogue}
                        onChange={(e) => setDialogue(e.target.value)}
                        placeholder="없음"
                        style={{
                          width: '100%',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          padding: '6px 9px',
                          borderRadius: 'var(--r4)',
                          fontSize: 12,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                        }}
                      />
                    </Box>
                    <Box className="bo-field">
                      <label>사운드</label>
                      <input
                        value={sound}
                        onChange={(e) => setSound(e.target.value)}
                        placeholder="없음"
                        style={{
                          width: '100%',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          padding: '6px 9px',
                          borderRadius: 'var(--r4)',
                          fontSize: 12,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                        }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      분위기
                    </label>
                    <Box className="mood-tags">
                      {MOOD_TAG_OPTIONS.map((tag) => (
                        <Box
                          key={tag.value}
                          className={`mood-tag ${moodTags.includes(tag.value) ? 'on' : ''}`}
                          onClick={() => {
                            setMoodTags((prev) =>
                              prev.includes(tag.value)
                                ? prev.filter((t) => t !== tag.value)
                                : [...prev, tag.value]
                            );
                          }}
                          style={
                            moodTags.includes(tag.value)
                              ? {
                                  background: 'var(--accent-dim)',
                                  borderColor: 'var(--accent)',
                                  color: 'var(--accent)',
                                }
                              : {}
                          }
                        >
                          {tag.labelKo}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Import options */}
              {selectedMethod === 'import' && (
                <Box className="import-options show">
                  <Box
                    className="drop-zone"
                    onClick={handleFileSelect}
                    style={{ cursor: 'pointer' }}
                  >
                    {importedImage ? (
                      <>
                        <Box
                          component="img"
                          src={importedImage}
                          alt="Imported"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            objectFit: 'contain',
                            borderRadius: 4,
                          }}
                        />
                        <Box className="drop-zone-sub" style={{ marginTop: 8 }}>
                          클릭하여 다른 파일 선택
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box className="drop-zone-icon" style={{ fontSize: 22 }}>+</Box>
                        <Box className="drop-zone-text">파일을 드래그하거나 클릭해서 선택</Box>
                        <Box className="drop-zone-sub">또는 클립보드에서 붙여넣기</Box>
                        <Box className="file-formats">
                          {['JPG', 'PNG', 'PSD', 'PDF', 'TIFF', 'WEBP'].map((f) => (
                            <Box key={f} className="fmt-badge">{f}</Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box className="import-meta">
                    <Box className="bo-field">
                      <label>샷 타입</label>
                      <Select
                        value={importShotType}
                        onChange={setImportShotType}
                        data={SHOT_TYPE_OPTIONS.map((o) => ({
                          value: o.value,
                          label: `${o.value} — ${o.description}`,
                        }))}
                        placeholder="지정 안 함"
                        size="sm"
                        clearable
                      />
                    </Box>
                    <Box className="bo-field">
                      <label>지속 시간</label>
                      <input
                        value={importDuration}
                        onChange={(e) => setImportDuration(e.target.value)}
                        placeholder="예: 3s"
                        style={{
                          width: '100%',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          padding: '6px 9px',
                          borderRadius: 'var(--r4)',
                          fontSize: 12,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                        }}
                      />
                    </Box>
                    <Box className="bo-field" style={{ gridColumn: 'span 2' }}>
                      <label>설명 (선택)</label>
                      <input
                        value={importDescription}
                        onChange={(e) => setImportDescription(e.target.value)}
                        placeholder="이 프레임 설명..."
                        style={{
                          width: '100%',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          padding: '6px 9px',
                          borderRadius: 'var(--r4)',
                          fontSize: 12,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* AI options */}
              {selectedMethod === 'ai' && (
                <Box className="ai-options show">
                  <Box className="ai-prompt-area">
                    <Box className="ai-prompt-icon"><IconSparkles size={12} stroke={1.5} /></Box>
                    <textarea
                      className="ai-prompt-input"
                      placeholder="예: 미소가 창밖을 바라보는 클로즈업. 수업 중이지만 딴생각을 하고 있다. 오후의 빛이 창문을 통해 들어온다."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </Box>
                  <Box className="bo-row">
                    <Box className="bo-field">
                      <label>샷 타입 힌트</label>
                      <Select
                        value={aiShotHint}
                        onChange={setAiShotHint}
                        data={SHOT_TYPE_OPTIONS.map((o) => ({
                          value: o.value,
                          label: `${o.value} — ${o.description}`,
                        }))}
                        placeholder="AI 자동 결정"
                        size="sm"
                        clearable
                      />
                    </Box>
                    <Box className="bo-field">
                      <label>지속 시간</label>
                      <input
                        value={aiDuration}
                        onChange={(e) => setAiDuration(e.target.value)}
                        placeholder="예: 3s"
                        style={{
                          width: '100%',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          padding: '6px 9px',
                          borderRadius: 'var(--r4)',
                          fontSize: 12,
                          fontFamily: 'var(--sans)',
                          outline: 'none',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Box className="ap-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isGenerating}>
            취소
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedMethod || isGenerating || (selectedMethod === 'import' && !importedImage)}
            style={
              !selectedMethod || isGenerating || (selectedMethod === 'import' && !importedImage)
                ? { background: 'var(--bg4)', color: 'var(--text3)', cursor: 'not-allowed' }
                : {}
            }
          >
            {isGenerating ? (
              <Loader size={12} color="var(--accent)" />
            ) : (
              getConfirmLabel()
            )}
          </button>
        </Box>
      </Box>
    </Box>
  );
}
