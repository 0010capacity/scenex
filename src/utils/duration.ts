import { Panel } from '@/types';

export function calculateSceneDuration(panels: Panel[]): string {
  if (panels.length === 0) return '0s';

  const totalSeconds = panels.reduce((acc, p) => {
    const match = p.duration.match(/(\d+)s/);
    return acc + (match ? parseInt(match[1]) : 3);
  }, 0);

  if (totalSeconds < 60) return `${totalSeconds}s`;

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
