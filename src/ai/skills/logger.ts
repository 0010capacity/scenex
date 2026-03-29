export interface SkillLogEntry {
  timestamp: string;
  skill: string;
  tool: string;
  params: Record<string, unknown>;
  result: 'success' | 'failed' | 'validation_error';
  message?: string;
  error?: string;
  duration: number; // ms
}

class SkillLogger {
  private logs: SkillLogEntry[] = [];
  private maxLogs = 100;

  log(entry: Omit<SkillLogEntry, 'timestamp'>): void {
    const fullEntry: SkillLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    console.debug(
      `[Skill:${entry.skill}.${entry.tool}]`,
      entry.result,
      `(${entry.duration}ms)`,
      entry.message || entry.error || ''
    );
  }

  getLogs(): SkillLogEntry[] {
    return this.logs;
  }

  getRecentErrors(): SkillLogEntry[] {
    return this.logs.filter(l => l.result !== 'success');
  }

  clear(): void {
    this.logs = [];
  }
}

export const skillLogger = new SkillLogger();
