import { Panel } from '@/types';

/**
 * Parse a duration string into seconds.
 * Supports formats:
 * - "3s", "10s" - seconds with suffix
 * - "2.5s", "0.5s" - fractional seconds
 * - "00:03", "1:30", "01:30" - mm:ss or h:mm:ss format
 * - "3", "10" - plain number (treated as seconds)
 * - "3 seconds", "1 minute" - natural language
 * - "1m30s", "2m" - minute/second notation
 * Returns 3 (default) for invalid/unrecognized formats.
 */
export function parseDuration(duration: string | null | undefined): number {
  if (!duration || typeof duration !== 'string') return 3;

  const input = duration.trim().toLowerCase();

  if (input === '') return 3;

  // mm:ss or h:mm:ss format (e.g., "00:03", "1:30", "1:30:00")
  const timeMatch = input.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = timeMatch[3] ? parseInt(timeMatch[1]) : 0;
    const mins = timeMatch[3] ? parseInt(timeMatch[2]) : parseInt(timeMatch[1]);
    const secs = timeMatch[3] ? parseInt(timeMatch[3]) : parseInt(timeMatch[2]);
    return hours * 3600 + mins * 60 + secs;
  }

  // Minute/second notation (e.g., "1m30s", "2m", "30s")
  const msMatch = input.match(/^(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/);
  if (msMatch && (msMatch[1] || msMatch[2])) {
    const mins = msMatch[1] ? parseFloat(msMatch[1]) : 0;
    const secs = msMatch[2] ? parseFloat(msMatch[2]) : 0;
    return Math.round(mins * 60 + secs);
  }

  // Seconds with optional decimal (e.g., "3s", "2.5s")
  const secMatch = input.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?$/);
  if (secMatch) {
    return Math.round(parseFloat(secMatch[1]));
  }

  // Plain number (e.g., "3", "10")
  const numMatch = input.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    return Math.round(parseFloat(numMatch[1]));
  }

  // Natural language (e.g., "3 seconds", "1 minute", "1 min 30 sec")
  const nlMatch = input.match(
    /(?:(\d+(?:\.\d+)?)\s*(?:h(?:our)?s?|시간))?\s*(?:(\d+(?:\.\d+)?)\s*(?:m(?:in(?:ute)?s?|분)))?\s*(?:(\d+(?:\.\d+)?)\s*(?:s(?:ec(?:ond)?s?|초))?)?/
  );
  if (nlMatch) {
    const hours = nlMatch[1] ? parseFloat(nlMatch[1]) : 0;
    const mins = nlMatch[2] ? parseFloat(nlMatch[2]) : 0;
    const secs = nlMatch[3] ? parseFloat(nlMatch[3]) : 0;
    if (hours || mins || secs) {
      return Math.round(hours * 3600 + mins * 60 + secs);
    }
  }

  // Unrecognized format - return default
  return 3;
}

/**
 * Format seconds into a human-readable duration string.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins < 60) {
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateSceneDuration(panels: Panel[]): string {
  if (panels.length === 0) return '0s';

  const totalSeconds = panels.reduce((acc, p) => acc + parseDuration(p.duration), 0);
  return formatDuration(totalSeconds);
}
