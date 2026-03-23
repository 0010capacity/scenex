import { invoke } from '@tauri-apps/api/core';
import { useUIStore } from '@/stores/uiStore';

interface ClaudeStatus {
  available: boolean;
  version: string | null;
  path: string | null;
}

interface GeneratePanelRequest {
  description: string;
  shot_type?: string;
  mood_tags: string[];
}

interface GeneratePanelResponse {
  svg_data: string | null;
  description: string;
  success: boolean;
  error: string | null;
}

export function useClaude() {
  const { setClaudeStatus } = useUIStore();

  const checkAvailability = async (): Promise<ClaudeStatus> => {
    try {
      const status = await invoke<ClaudeStatus>('check_claude_available');
      setClaudeStatus(status.available ? 'available' : 'unavailable');
      return status;
    } catch (error) {
      console.error('Failed to check Claude availability:', error);
      setClaudeStatus('unavailable');
      return { available: false, version: null, path: null };
    }
  };

  const generatePanel = async (
    description: string,
    shotType?: string,
    moodTags: string[] = []
  ): Promise<GeneratePanelResponse> => {
    const request: GeneratePanelRequest = {
      description,
      shot_type: shotType,
      mood_tags: moodTags,
    };

    try {
      const response = await invoke<GeneratePanelResponse>('generate_panel', {
        request,
      });
      return response;
    } catch (error) {
      return {
        svg_data: null,
        description,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return {
    checkAvailability,
    generatePanel,
  };
}
