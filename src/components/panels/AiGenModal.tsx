import { Box, Text, Select, Loader, Progress, Button, ActionIcon } from '@mantine/core';
import { IconSparkles, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useAIStore } from '@/stores/aiStore';
import { useClaude } from '@/hooks/useClaude';
import { MoodTag, SHOT_TYPE_OPTIONS, MOOD_TAG_OPTIONS } from '@/types';
import { ScenarioAIGenerator } from '../scenario/ScenarioAIGenerator';

interface AiGenModalProps {
  opened: boolean;
  onClose: () => void;
}

interface GeneratedPanelPreview {
  description: string;
  shotType: string;
  duration: string;
}

export function AiGenModal({ opened, onClose }: AiGenModalProps) {
  const project = useProjectStore(s => s.project);
  const addPanel = useProjectStore(s => s.addPanel);
  const addScene = useProjectStore(s => s.addScene);
  const addNotification = useUIStore(s => s.addNotification);
  const addTask = useAIStore(s => s.addTask);
  const updateTask = useAIStore(s => s.updateTask);
  const removeTask = useAIStore(s => s.removeTask);
  const { batchGeneratePanels } = useClaude();

  const [sceneDescription, setSceneDescription] = useState('');
  const [shotTypeHint, setShotTypeHint] = useState<string | null>(null);
  const [moodTags, setMoodTags] = useState<MoodTag[]>([]);
  const [panelCount, setPanelCount] = useState<string>('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<GeneratedPanelPreview[]>([]);
  const [generationMode, setGenerationMode] = useState<'scene' | 'scenario'>('scene');
  const [scenarioModalOpened, setScenarioModalOpened] = useState(false);

  if (!opened) return null;

  const handleClose = () => {
    setSceneDescription('');
    setShotTypeHint(null);
    setMoodTags([]);
    setPanelCount('4');
    setPreviews([]);
    setProgress(0);
    setIsGenerating(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isGenerating) {
      handleClose();
    }
  };

  const handleGenerate = async () => {
    if (!sceneDescription.trim() || !project) return;

    setIsGenerating(true);
    setProgress(0);
    setPreviews([]);

    const taskId = addTask({
      type: 'batch_generate',
      status: 'running',
      progress: 0,
      message: 'Generating panels...',
    });

    try {
      const response = await batchGeneratePanels(
        sceneDescription,
        parseInt(panelCount) || 4,
        shotTypeHint ?? undefined,
        moodTags,
      );

      if (response.success && response.panels) {
        setProgress(50);

        const sceneNumber = project.scenario.scenes.length + 1;
        const newSceneName = `Scene ${sceneNumber}`;

        addScene(newSceneName);

        const newScene = useProjectStore.getState().project?.scenario.scenes.find(
          (s) => s.name === newSceneName
        );

        if (newScene) {
          for (let i = 0; i < response.panels.length; i++) {
            const panelData = response.panels[i];
            addPanel(newScene.id, {
              number: i + 1,
              description: panelData.description,
              svgData: panelData.svg_data,
              shotType: panelData.shot_type as any,
              duration: panelData.duration,
              moodTags: moodTags,
              sourceType: 'ai',
            });
            setProgress(50 + Math.floor((i / response.panels.length) * 50));
          }

          setPreviews(
            response.panels.map((p) => ({
              description: p.description,
              shotType: p.shot_type,
              duration: p.duration,
            }))
          );
        }

        updateTask(taskId, { status: 'completed', progress: 100 });
        setTimeout(() => removeTask(taskId), 1000);
      } else {
        const errorMsg = response.error || 'Generation failed';
        updateTask(taskId, {
          status: 'failed',
          message: errorMsg,
        });
        addNotification('error', `AI 생성 실패: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      updateTask(taskId, {
        status: 'failed',
        message: errorMsg,
      });
      addNotification('error', `AI 생성 실패: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box className="modal-backdrop open" onClick={handleBackdropClick}>
      <Box className="ap-modal" style={{ width: 540 }}>
        {/* Header */}
        <Box className="ap-header">
          <Text style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconSparkles size={16} stroke={1.5} color="var(--accent)" />
            AI 일괄 생성
          </Text>
          <ActionIcon variant="subtle" onClick={handleClose}>
            <IconX size={16} stroke={1.5} />
          </ActionIcon>
        </Box>

        {/* Mode toggle */}
        <Box style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <Box style={{ display: 'flex', gap: 8 }}>
            <Button
              size="xs"
              variant={generationMode === 'scene' ? 'filled' : 'outline'}
              onClick={() => setGenerationMode('scene')}
            >
              장면
            </Button>
            <Button
              size="xs"
              variant={generationMode === 'scenario' ? 'filled' : 'outline'}
              onClick={() => setGenerationMode('scenario')}
            >
              시나리오
            </Button>
          </Box>
        </Box>

        {/* Body */}
        <Box className="ap-body">
          {generationMode === 'scenario' && (
            <Button
              fullWidth
              size="md"
              variant="light"
              leftSection={<IconSparkles size={16} stroke={1.5} />}
              onClick={() => setScenarioModalOpened(true)}
              style={{ marginTop: 8 }}
            >
              시나리오 전체를 AI로 생성하기
            </Button>
          )}
          {generationMode === 'scene' && (
            <Box>
              <Box className="bo-field">
                <label>장면 설명</label>
                <textarea
                  className="ai-prompt-input"
                  style={{
                    width: '100%',
                    minHeight: 80,
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r6)',
                    padding: '10px',
                    color: 'var(--text)',
                    fontFamily: 'var(--sans)',
                    fontSize: 12,
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                  placeholder="예: 옥상에서 만나는 두 친구. 준혁이 미소에게 아이스크림을 건네며 이야기를 시작한다. 노을이 지고 있고 도심의 붉은 빛이 하늘을 물들이고 있다."
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                />
              </Box>

              <Box className="bo-row">
                <Box className="bo-field">
                  <label>샷 타입 힌트</label>
                  <Select
                    value={shotTypeHint}
                    onChange={setShotTypeHint}
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
                  <label>패널 개수</label>
                  <Select
                    value={panelCount}
                    onChange={(v) => setPanelCount(v ?? '4')}
                    data={[
                      { value: '2', label: '2개' },
                      { value: '4', label: '4개' },
                      { value: '6', label: '6개' },
                      { value: '8', label: '8개' },
                      { value: '10', label: '10개' },
                      { value: '12', label: '12개' },
                      { value: '14', label: '14개' },
                      { value: '16', label: '16개' },
                    ]}
                    size="sm"
                  />
                </Box>
              </Box>

              <Box>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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

              {isGenerating && (
                <Box>
                  <Progress
                    value={progress}
                    size="lg"
                    color="indigo"
                    animated
                    style={{ background: 'var(--bg3)', borderRadius: 'var(--r4)' }}
                  />
                  <Text style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>
                    생성 중... {progress}%
                  </Text>
                </Box>
              )}

              {previews.length > 0 && (
                <Box
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r8)',
                    padding: 14,
                    background: 'var(--bg3)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>
                    생성 미리보기 ({previews.length}개 패널)
                  </Text>
                  <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {previews.map((preview, index) => (
                      <Box key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                          P{index + 1}: {preview.shotType} — {preview.duration}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: 'var(--text3)',
                            maxWidth: 280,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {preview.description.slice(0, 50)}...
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box className="ap-footer">
          <button className="btn btn-outline" onClick={handleClose} disabled={isGenerating}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!sceneDescription.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader size={12} color="#FFFFFF" />
                생성 중...
              </>
            ) : (
              <>
                <IconSparkles size={12} stroke={1.5} style={{ marginRight: 4 }} />
                스토리보드 생성
              </>
            )}
          </button>
        </Box>
      </Box>

      <ScenarioAIGenerator
        opened={scenarioModalOpened}
        onClose={() => setScenarioModalOpened(false)}
      />
    </Box>
  );
}
