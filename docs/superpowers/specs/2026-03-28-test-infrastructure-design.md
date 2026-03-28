# Frontend Test Infrastructure

**Issue**: #33
**Date**: 2026-03-28
**Status**: Approved

## Problem

Current project has no frontend test infrastructure. Only Rust code has `#[cfg(test)]` modules.

## Solution

Add Vitest for frontend testing (Vite-based project).

### 1. Install Dependencies

```bash
npm install -D vitest @vitest/coverage-v8 jsdom
```

### 2. Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### 3. Test Setup File

```typescript
// src/test/setup.ts
// Global test setup
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### 4. Test Priority

**High (Business Logic):**
- `src/stores/projectStore.ts` - Project state management
- `src/utils/duration.ts` - Duration formatting utility
- `src/utils/markdownParser.ts` - Markdown parsing logic

**Medium (Components):**
- `src/components/scenario/ScenarioEditor.tsx` - Scenario editor logic
- `src/components/panels/PanelCard.tsx` - Panel card rendering

**Low (UI Components):**
- Presentational components consider Storybook

### 5. Example Tests

```typescript
// src/stores/__tests__/projectStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../projectStore';
import { createEmptyProject } from '@/types';

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store state
    useProjectStore.setState({
      project: null,
      selectedSceneId: null,
      selectedPanelId: null,
      isDirty: false,
    });
  });

  it('should create new project with one scene', () => {
    useProjectStore.getState().newProject('Test Project');

    const project = useProjectStore.getState().project;
    expect(project).toBeDefined();
    expect(project!.scenes).toHaveLength(1);
    expect(project!.name).toBe('Test Project');
  });

  it('should add scene to project', () => {
    useProjectStore.getState().newProject('Test');
    const initialCount = useProjectStore.getState().project!.scenes.length;

    useProjectStore.getState().addScene('New Scene');

    const updatedProject = useProjectStore.getState().project;
    expect(updatedProject!.scenes).toHaveLength(initialCount + 1);
  });

  it('should select panel and auto-select scene', () => {
    useProjectStore.getState().newProject('Test');
    const sceneId = useProjectStore.getState().project!.scenes[0].id;
    const panelId = useProjectStore.getState().project!.scenes[0].panels[0]?.id;

    if (panelId) {
      useProjectStore.getState().selectPanel(panelId);

      expect(useProjectStore.getState().selectedPanelId).toBe(panelId);
      expect(useProjectStore.getState().selectedSceneId).toBe(sceneId);
    }
  });
});
```

```typescript
// src/utils/__tests__/duration.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSceneDuration, formatDuration } from '../duration';

describe('calculateSceneDuration', () => {
  it('should sum panel durations', () => {
    const panels = [
      { duration: '3s' },
      { duration: '2s' },
      { duration: '4s' },
    ] as any[];
    expect(calculateSceneDuration(panels)).toBe(9);
  });

  it('should handle empty panels', () => {
    expect(calculateSceneDuration([])).toBe(0);
  });

  it('should default to 3s for missing duration', () => {
    const panels = [{ duration: '' }, { duration: '2s' }] as any[];
    expect(calculateSceneDuration(panels)).toBe(5);
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(65)).toBe('1m 5s');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(120)).toBe('2m 0s');
  });

  it('should handle zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});
```

## Files to Create/Modify

### New Files
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/stores/__tests__/projectStore.test.ts`
- `src/utils/__tests__/duration.test.ts`

### Modified Files
- `package.json` (add devDependencies)

## Test Commands

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Benefits

- Catch bugs during refactoring
- Improve confidence in changes
- Speed up development with faster feedback
