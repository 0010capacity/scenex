# Skill System Zod Validation Design

**Date:** 2026-03-29
**Author:** Claude
**Status:** Draft

## Overview

Improve skill call accuracy and error handling in SceneX's AI copilot system using Zod for runtime validation.

## Goals

1. **Improve skill call accuracy** - AI uses correct tools with correct parameters
2. **Better error handling** - Detailed validation errors help AI self-correct
3. **Consistent code-prompts** - Zod schemas auto-generate prompt documentation
4. **Maintainable** - Type inference reduces manual type management

## Architecture

```
AI Response → Zod Validation → Parameter Validation → Execution → Logging
     │                │                  │                  │          │
     ▼                ▼                  ▼                  ▼          ▼
  JSON parse    SkillCall schema    Tool-specific      SkillResult   skillLogger
  errors       + format errors      Zod schemas        with details
```

## Components

### 1. Zod Schemas (`src/ai/skills/schemas.ts`)

Define all tool parameters with Zod:

```typescript
import { z } from 'zod';

export const ShotTypeEnum = z.enum(['EWS', 'WS', 'MS', 'CU', 'ECU', 'OTS', 'POV']);
export const MoodTagEnum = z.enum(['emotional', 'golden', 'tension', 'humor', 'excitement', 'sadness']);
export const CameraMovementEnum = z.enum(['Static', 'Pan', 'Tilt', 'Dolly', 'Pullback']);
export const TransitionEnum = z.enum(['cut', 'fadein', 'fadeout', 'dissolve']);
export const DurationSchema = z.string().regex(/^\d+(\.\d+)?s$/, 'Duration must be number + s (e.g., 2s, 3.5s)');

export const AddPanelParamsSchema = z.object({
  scene_id: z.string().optional(),
  after_panel_id: z.string().optional(),
  shot_type: ShotTypeEnum.optional(),
  description: z.string().min(5).optional(),
  dialogue: z.string().optional(),
  sound: z.string().optional(),
  mood_tags: z.array(MoodTagEnum).min(1).max(3).optional(),
  generate_svg: z.boolean().optional(),
});

// ... other tool schemas
```

### 2. Validation Layer (`src/ai/skills/registry.ts`)

Add validation to skill execution:

```typescript
import { z, ZodError } from 'zod';

export function validateParams<T extends z.ZodType>(
  schema: T,
  params: Record<string, unknown>
): { success: true; data: z.infer<T> } | { success: false; errors: ValidationError[] } {
  try {
    return { success: true, data: schema.parse(params) };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }))};
    }
    return { success: false, errors: [{ path: '', message: String(error) }] };
  }
}
```

### 3. Logger (`src/ai/skills/logger.ts`)

Structured logging for debugging:

```typescript
interface SkillLogEntry {
  timestamp: string;
  skill: string;
  tool: string;
  params: Record<string, unknown>;
  result: 'success' | 'failed' | 'validation_error';
  message?: string;
  error?: string;
  duration: number;
}

export const skillLogger = new SkillLogger();
```

### 4. Prompt Generation

Auto-generate tool documentation from Zod schemas:

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

export function schemaToToolDescription(schema: z.ZodType, description: string): string {
  const jsonSchema = zodToJsonSchema(schema);
  // Convert to human-readable format for prompts
}
```

## Prompt Improvements

### Principles

1. **No examples** - User requested no examples in prompts
2. **Declarative descriptions** - "When to use" and "What it does" in prose
3. **Clear parameter descriptions** - Every parameter has Korean description
4. **Decision guidelines** - When to use each tool in natural language
5. **Error handling guide** - How to handle validation/execution errors

### Before (current)

```markdown
- `add_panel`: Add a new panel to a scene
  - Parameters: `scene_id` (optional), `shot_type` (optional), ...
```

### After (proposed)

```markdown
### add_panel
새 패널을 씬에 추가합니다.

**Parameters:**
- scene_id: 대상 씬 ID. 없으면 현재 선택된 씬.
- shot_type: EWS(초원경), WS(원경), MS(중경), CU(근접), ECU(초근접), OTS(오버숄더), POV(주관)
...

**When to use:** "새 패널 추가해줘", "패널 만들어줘" 요청 시.
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/ai/skills/schemas.ts` | New - Zod schemas for all tools |
| `src/ai/skills/registry.ts` | Add validateParams(), formatValidationErrors() |
| `src/ai/skills/logger.ts` | New - SkillLogger class |
| `src/ai/skills/types.ts` | Update ToolParameter type for schema reference |
| `src/ai/skills/storyboard.ts` | Add schema exports, use validation |
| `src/ai/skills/scenario.ts` | Add schema exports, use validation |
| `src-tauri/prompts/copilot_storyboard.md` | Improve tool descriptions |
| `src-tauri/prompts/copilot_scenario.md` | Improve tool descriptions |

## Dependencies

```bash
npm install zod zod-to-json-schema
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Zod bundle size increase | Tree-shaking, import only needed schemas |
| Schema duplication | Auto-generate from single source |
| Breaking existing behavior | Incremental rollout, feature flag |

## Success Metrics

- AI tool call accuracy: >95% (currently ~80%)
- Validation error → AI self-correction rate: >70%
- Log retention for debugging: 100 entries
