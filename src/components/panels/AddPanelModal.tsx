import {
  Modal,
  Text,
  Group,
  Card,
  Stack,
  Button,
  Textarea,
  Select,
  Chip,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconSquare,
  IconUpload,
  IconSparkles,
  IconFileImport,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';
import { useClaude } from '@/hooks/useClaude';
import { useUIStore } from '@/stores/uiStore';
import { SHOT_TYPE_OPTIONS, MOOD_TAG_OPTIONS, MoodTag } from '@/types';

interface AddPanelModalProps {
  opened: boolean;
  onClose: () => void;
  sceneId: string | null;
}

type AddMethod = 'blank' | 'import' | 'ai' | null;

export function AddPanelModal({ opened, onClose, sceneId }: AddPanelModalProps) {
  const { addPanel, project } = useProjectStore();
  const { addTask, updateTask, removeTask } = useAIStore();
  const { generatePanel } = useClaude();
  const { claudeStatus } = useUIStore();
  const [selectedMethod, setSelectedMethod] = useState<AddMethod>(null);
  const [description, setDescription] = useState('');
  const [shotType, setShotType] = useState<string | null>(null);
  const [moodTags, setMoodTags] = useState<MoodTag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isLoading = useAIStore((state) => state.isProcessing);

  const handleAddBlank = () => {
    if (!sceneId) return;

    const scene = project?.scenes.find((s) => s.id === sceneId);
    const panelNumber = scene ? scene.panels.length + 1 : 1;

    addPanel(sceneId, {
      number: panelNumber,
      sourceType: 'manual',
    });

    onClose();
    setSelectedMethod(null);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setShotType(null);
    setMoodTags([]);
    setError(null);
  };

  const handleAddAI = async () => {
    if (!sceneId || !description.trim()) return;

    const scene = project?.scenes.find((s) => s.id === sceneId);
    const panelNumber = scene ? scene.panels.length + 1 : 1;

    // Create AI task for tracking
    const taskId = addTask({
      type: 'generate_panel',
      status: 'running',
      progress: 0,
      message: 'Generating panel...',
      sceneId,
    });

    setError(null);

    try {
      const response = await generatePanel(
        description,
        shotType ?? undefined,
        moodTags
      );

      if (response.success && response.svg_data) {
        // Add panel with AI-generated SVG
        addPanel(sceneId, {
          number: panelNumber,
          description: response.description || description,
          svgData: response.svg_data,
          sourceType: 'ai',
          shotType: shotType as any,
          moodTags: moodTags,
        });

        updateTask(taskId, { status: 'completed', progress: 100 });
        setTimeout(() => removeTask(taskId), 1000);

        onClose();
        setSelectedMethod(null);
        resetForm();
      } else {
        // Generation failed - still add panel but without SVG
        addPanel(sceneId, {
          number: panelNumber,
          description: description,
          sourceType: 'ai',
          shotType: shotType as any,
          moodTags: moodTags,
        });

        updateTask(taskId, {
          status: 'failed',
          message: response.error || 'Generation failed'
        });
        setError(response.error || 'AI generation failed. Panel added without image.');
      }
    } catch (err) {
      updateTask(taskId, {
        status: 'failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      setError(err instanceof Error ? err.message : 'Failed to generate panel');
    }
  };

  const handleFileImport = async () => {
    if (!sceneId) return;

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const filePath = await open({
        multiple: false,
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (filePath && typeof filePath === 'string') {
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const fileData = await readFile(filePath);
        const base64 = btoa(
          new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Detect mime type from extension
        const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
        const mimeTypes: Record<string, string> = {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        const mimeType = mimeTypes[ext] || 'image/png';

        const scene = project?.scenes.find((s) => s.id === sceneId);
        const panelNumber = scene ? scene.panels.length + 1 : 1;

        addPanel(sceneId, {
          number: panelNumber,
          imageData: `data:${mimeType};base64,${base64}`,
          sourceType: 'imported',
        });

        onClose();
        setSelectedMethod(null);
      }
    } catch (err) {
      console.error('Failed to import file:', err);
      setError(err instanceof Error ? err.message : 'Failed to import file');
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          foundImage = true;
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            if (sceneId) {
              const scene = project?.scenes.find((s) => s.id === sceneId);
              const panelNumber = scene ? scene.panels.length + 1 : 1;
              addPanel(sceneId, {
                number: panelNumber,
                imageData: base64,
                sourceType: 'imported',
              });
            }
          };
          reader.readAsDataURL(blob);
          onClose();
          setSelectedMethod(null);
          break;
        }
      }

      if (!foundImage) {
        setError('No image found in clipboard. Copy an image first, then try again.');
      }
    } catch (err) {
      console.error('Failed to paste image:', err);
      // This can happen if permission is denied or clipboard is empty
      setError('Could not read clipboard. Make sure you have an image copied and try again.');
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        setSelectedMethod(null);
        setDescription('');
      }}
      title="Add Panel"
      size="lg"
      centered
    >
      {!selectedMethod ? (
        <Stack gap={16}>
          <Text size="sm" c="dimmed">
            Choose how you want to add a new panel
          </Text>

          <Group grow>
            <Card
              padding="lg"
              style={{
                cursor: 'pointer',
                backgroundColor: '#1A1C24',
                border: '1px solid #2A2826',
                transition: 'border-color 0.15s ease',
              }}
              onClick={handleAddBlank}
            >
              <Stack align="center" gap={12}>
                <IconSquare size={32} color="#E8A838" />
                <Text size="sm" fw={500}>
                  Blank Panel
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Start with an empty panel
                </Text>
              </Stack>
            </Card>

            <Card
              padding="lg"
              style={{
                cursor: 'pointer',
                backgroundColor: '#1A1C24',
                border: '1px solid #2A2826',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => setSelectedMethod('import')}
            >
              <Stack align="center" gap={12}>
                <IconUpload size={32} color="#4ECDC4" />
                <Text size="sm" fw={500}>
                  Import Image
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Upload or paste an image
                </Text>
              </Stack>
            </Card>

            <Card
              padding="lg"
              style={{
                cursor: 'pointer',
                backgroundColor: '#1A1C24',
                border: '1px solid #2A2826',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => setSelectedMethod('ai')}
            >
              <Stack align="center" gap={12}>
                <IconSparkles size={32} color="#FF6B6B" />
                <Text size="sm" fw={500}>
                  AI Generate
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Describe the shot to generate
                </Text>
              </Stack>
            </Card>
          </Group>
        </Stack>
      ) : selectedMethod === 'import' ? (
        <Stack gap={16}>
          <Button
            variant="light"
            size="lg"
            leftSection={<IconFileImport size={20} />}
            onClick={handlePaste}
          >
            Paste from Clipboard
          </Button>

          <Text size="sm" c="dimmed" ta="center">
            or
          </Text>

          <Button
            variant="outline"
            size="lg"
            leftSection={<IconUpload size={20} />}
            onClick={handleFileImport}
          >
            Choose File
          </Button>

          <Button variant="subtle" onClick={() => setSelectedMethod(null)}>
            Back
          </Button>
        </Stack>
      ) : (
        <Stack gap={16}>
          {claudeStatus === 'unavailable' && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="AI Unavailable"
              color="yellow"
              variant="light"
            >
              Claude CLI is not available. Panel will be created without AI-generated image.
            </Alert>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <Textarea
            label="Describe the shot"
            placeholder="A close-up of a character's face, looking thoughtfully out a window, golden hour lighting..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            required
          />

          <Select
            label="Shot Type (optional)"
            placeholder="Select shot type"
            value={shotType}
            onChange={(value) => setShotType(value)}
            data={SHOT_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: `${o.label} - ${o.description}`,
            }))}
            clearable
          />

          <Box>
            <Text size="sm" mb={8}>
              Mood Tags (optional)
            </Text>
            <Group gap={8}>
              {MOOD_TAG_OPTIONS.map((tag) => (
                <Chip
                  key={tag.value}
                  checked={moodTags.includes(tag.value)}
                  onChange={() => {
                    setMoodTags((prev) =>
                      prev.includes(tag.value)
                        ? prev.filter((t) => t !== tag.value)
                        : [...prev, tag.value]
                    );
                  }}
                  color="gold"
                  variant="light"
                  size="sm"
                >
                  {tag.label}
                </Chip>
              ))}
            </Group>
          </Box>

          <Group justify="flex-end" mt={8}>
            <Button variant="subtle" onClick={() => { setSelectedMethod(null); resetForm(); }}>
              Back
            </Button>
            <Button
              variant="filled"
              color="gold"
              loading={isLoading}
              onClick={handleAddAI}
              disabled={!description.trim()}
            >
              Generate Panel
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
