import { describe, it, expect } from 'vitest';
import { parseDuration, formatDuration, calculateSceneDuration } from '../duration';
import { Panel } from '@/types';

describe('parseDuration', () => {
  it('should return default 3 for null/undefined', () => {
    expect(parseDuration(null)).toBe(3);
    expect(parseDuration(undefined)).toBe(3);
  });

  it('should return default 3 for empty string', () => {
    expect(parseDuration('')).toBe(3);
    expect(parseDuration('   ')).toBe(3);
  });

  it('should parse seconds with suffix', () => {
    expect(parseDuration('3s')).toBe(3);
    expect(parseDuration('10s')).toBe(10);
    expect(parseDuration('30s')).toBe(30);
  });

  it('should parse fractional seconds', () => {
    expect(parseDuration('2.5s')).toBe(3); // rounded
    expect(parseDuration('0.5s')).toBe(1); // rounded
  });

  it('should parse mm:ss format', () => {
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('00:03')).toBe(3);
    expect(parseDuration('10:00')).toBe(600);
  });

  it('should parse h:mm:ss format', () => {
    expect(parseDuration('1:30:00')).toBe(5400);
    expect(parseDuration('2:15:30')).toBe(8130);
  });

  it('should parse minute/second notation', () => {
    expect(parseDuration('2m')).toBe(120);
    expect(parseDuration('1m30s')).toBe(90);
    expect(parseDuration('30s')).toBe(30);
  });

  it('should parse plain numbers as seconds', () => {
    expect(parseDuration('5')).toBe(5);
    expect(parseDuration('120')).toBe(120);
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(3)).toBe('3s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('should format mm:ss for under an hour', () => {
    expect(formatDuration(60)).toBe('1m'); // exact minute uses 'm' suffix
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('should format h:mm:ss for over an hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(5400)).toBe('1:30:00');
  });
});

describe('calculateSceneDuration', () => {
  it('should return 0s for empty panels', () => {
    expect(calculateSceneDuration([])).toBe('0s');
  });

  it('should sum panel durations', () => {
    const panels = [
      { duration: '3s' },
      { duration: '2s' },
      { duration: '4s' },
    ] as Panel[];
    expect(calculateSceneDuration(panels)).toBe('9s');
  });

  it('should handle mixed formats', () => {
    const panels = [
      { duration: '1:30' }, // 90s
      { duration: '30s' }, // 30s
    ] as Panel[];
    expect(calculateSceneDuration(panels)).toBe('2m'); // 120s = 2m
  });

  it('should use default 3s for invalid durations', () => {
    const panels = [
      { duration: 'invalid' },
      { duration: '5s' },
    ] as Panel[];
    expect(calculateSceneDuration(panels)).toBe('8s'); // 3 + 5
  });
});
