# Skill System Zod Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add runtime validation with Zod to improve AI tool call accuracy and provide detailed error messages.

**Architecture:** Add a Zod schema layer between AI response parsing and skill execution. Schemas validate tool parameters at runtime, with detailed error messages that can guide AI self-correction. A logger tracks execution history for debugging.

**Tech Stack:** TypeScript, Zod, zod-to-json-schema

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/ai/skills/schemas.ts` | Zod schemas for all tool parameters |
| `src/ai/skills/logger.ts` | SkillLogger class for execution tracking |
| `src/ai/skills/registry.ts` | Add validation helpers |
| `src/ai/skills/types.ts` | Minor updates for schema references |
| `src/ai/skills/storyboard.ts` | Export schemas, integrate validation |
| `src/ai/skills/scenario.ts` | Export schemas, integrate validation |
| `src-tauri/prompts/copilot_storyboard.md` | Improved tool descriptions |
| `src-tauri/prompts/copilot_scenario.md` | Improved tool descriptions |
| `package.json` | Add zod dependencies |

---

## Task 1: Add zod dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add zod packages**

Run:
```bash
npm install zod zod-to-json-schema
```

Expected: zod and zod-to-json-schema added to package.json

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod and zod-to-json-schema

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create Zod schemas file

**Files:**
- Create: `src/ai/skills/schemas.ts`

- [ ] **Step 1: Write schema file**

```typescript
import { z } from 'zod';

// ============ Enums ============

export const ShotTypeEnum = z.enum([
  'EWS', 'WS', 'MS', 'CU', 'ECU', 'OTS', 'POV'
]);
export type ShotType = z.infer<typeof ShotTypeEnum>;

export const MoodTagEnum = z.enum([
  'emotional', 'golden', 'tension', 'humor', 'excitement', 'sadness'
]);
export type MoodTag = z.infer<typeof MoodTagEnum>;

export const CameraMovementEnum = z.enum([
  'Static', 'Pan', 'Tilt', 'Dolly', 'Pullback'
]);
export type CameraMovement = z.infer<typeof CameraMovementEnum>;

export const TransitionEnum = z.enum([
  'cut', 'fadein', 'fadeout', 'dissolve'
]);
export type Transition = z.infer<typeof TransitionEnum>;

export const CinematicStyleEnum = z.enum([
  'slash_cut', 'continuous', 'montage', 'slow_paced', 'action'
]);
export type CinematicStyle = z.infer<typeof CinematicStyleEnum>;

export const ExpansionTypeEnum = z.enum([
  'scene', 'subplot', 'character', 'dialogue'
]);
export type ExpansionType = z.infer<typeof ExpansionTypeEnum>;

// ============ Duration ============

export const DurationSchema = z.string().regex(
  /^\d+(\.\d+)?s$/,
  '지속 시간은 숫자 + s 형식이어야 합니다 (예: 2s, 3.5s)'
);

// ============ Storyboard Tool Schemas ============

export const AddPanelParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('대상 씬 ID. 지정하지 않으면 현재 선택된 씬에 추가됩니다.'),
  after_panel_id: z.string().optional()
    .describe('이 패널 ID 뒤에 새 패널을 삽입합니다.'),
  shot_type: ShotTypeEnum.optional()
    .describe('샷 타입: EWS(초원경), WS(원경), MS(중경), CU(근접), ECU(초근접), OTS(오버숄더), POV(주관)'),
  description: z.string().min(5).max(500).optional()
    .describe('패널의 시각적 묘사. 인물 동작, 배치, 환경을 구체적으로 서술. 5자 이상.'),
  dialogue: z.string().max(300).optional()
    .describe('대사. 말하는 인물이 있다면 포함.'),
  sound: z.string().max(200).optional()
    .describe('효과음이나 배경음 설명.'),
  mood_tags: z.array(MoodTagEnum).min(1).max(3).optional()
    .describe('무드 태그 배열. 1-3개 권장.'),
  generate_svg: z.boolean().optional()
    .describe('패널 추가 후 자동으로 SVG 생성할지 여부.'),
});
export type AddPanelParams = z.infer<typeof AddPanelParamsSchema>;

export const EditPanelParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널을 수정합니다.'),
  shot_type: ShotTypeEnum.optional(),
  description: z.string().min(5).max(500).optional(),
  dialogue: z.string().max(300).optional(),
  sound: z.string().max(200).optional(),
  mood_tags: z.array(MoodTagEnum).optional(),
  camera_movement: CameraMovementEnum.optional()
    .describe('카메라 움직임: Static(고정), Pan(좌우), Tilt(상하), Dolly(전후), Pullback(후퇴)'),
  duration: DurationSchema.optional(),
  transition: TransitionEnum.optional(),
});
export type EditPanelParams = z.infer<typeof EditPanelParamsSchema>;

export const DeletePanelParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널을 삭제합니다.'),
});

export const DrawSvgParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널.'),
  description: z.string().optional()
    .describe('SVG 생성용 묘사. 없으면 기존 패널 묘사 사용.'),
  style_hint: z.enum(['minimal', 'detailed', 'sketch']).optional()
    .describe('스타일 힌트: minimal(미니멀), detailed(디테일), sketch(스케치)'),
});

export const ReorderPanelsParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('씬 ID. 지정하지 않으면 현재 선택된 씬.'),
  panel_ids: z.array(z.string()).min(1)
    .describe('새 순서대로 패널 ID 배열. 모든 패널을 포함해야 합니다.'),
});

export const BatchEditParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('씬 ID. 지정하지 않으면 현재 선택된 씬.'),
  style: CinematicStyleEnum.optional()
    .describe('시네마틱 스타일: slash_cut(짧은 컷), continuous(연속), montage(몬타주), slow_paced(느린 페이싱), action(액션)'),
  mood_tags: z.array(MoodTagEnum).optional(),
  default_duration: DurationSchema.optional(),
});

export const GenerateStoryboardParamsSchema = z.object({
  panel_count: z.number().int().min(1).max(100).optional()
    .default(16)
    .describe('생성할 총 패널 수.'),
});

// ============ Scenario Tool Schemas ============

export const EditScenarioParamsSchema = z.object({
  name: z.string().min(1).max(100).optional()
    .describe('새 시나리오 이름.'),
  description: z.string().max(500).optional()
    .describe('시나리오 설명.'),
  content: z.string().optional()
    .describe('전체 내용 교체.'),
  append_content: z.string().optional()
    .describe('내용 뒤에 추가.'),
  prepend_content: z.string().optional()
    .describe('내용 앞에 추가.'),
});

export const ExpandScenarioParamsSchema = z.object({
  expansion_type: ExpansionTypeEnum.optional()
    .default('scene')
    .describe('확장 유형: scene(새 씬), subplot(서브플롯), character(캐릭터), dialogue(대사)'),
  content: z.string().min(10)
    .describe('추가할 내용. 10자 이상.'),
});

export const CondenseScenarioParamsSchema = z.object({
  content: z.string().min(10)
    .describe('축약된 시나리오 내용.'),
});

export const PolishScenarioParamsSchema = z.object({
  content: z.string().min(10)
    .describe('다듬어진 시나리오 내용.'),
});

// ============ Skill Call Schema ============

export const SkillCallSchema = z.object({
  skill: z.string().min(1),
  tool: z.string().min(1),
  parameters: z.record(z.unknown()),
});

export const CopilotResponseSchema = z.object({
  thinking: z.string().optional(),
  skill_calls: z.array(SkillCallSchema).optional().default([]),
  message: z.string().optional(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/schemas.ts
git commit -m "feat: add Zod schemas for skill tool parameters

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create logger

**Files:**
- Create: `src/ai/skills/logger.ts`

- [ ] **Step 1: Write logger file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/logger.ts
git commit -m "feat: add SkillLogger for execution tracking

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add validation helpers to registry

**Files:**
- Modify: `src/ai/skills/registry.ts`

- [ ] **Step 1: Add validation helpers at top of registry.ts**

Add after imports:

```typescript
import { z, ZodError } from 'zod';

export interface ValidationError {
  path: string;
  message: string;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `- ${e.path}: ${e.message}`).join('\n');
}

export function validateParams<T extends z.ZodType>(
  schema: T,
  params: Record<string, unknown>
): { success: true; data: z.infer<T> } | { success: false; errors: ValidationError[] } {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return { success: false, errors };
    }
    return { success: false, errors: [{ path: '', message: String(error) }] };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/registry.ts
git commit -m "feat: add validateParams and formatValidationErrors to registry

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Integrate validation into storyboard skill

**Files:**
- Modify: `src/ai/skills/storyboard.ts`

- [ ] **Step 1: Import schemas and logger, add validation to executors**

Add imports:
```typescript
import {
  AddPanelParamsSchema,
  EditPanelParamsSchema,
  DeletePanelParamsSchema,
  DrawSvgParamsSchema,
  ReorderPanelsParamsSchema,
  BatchEditParamsSchema,
  GenerateStoryboardParamsSchema,
} from './schemas';
import { validateParams, formatValidationErrors } from './registry';
import { skillLogger } from './logger';
```

Update `addPanel` function - wrap at start:
```typescript
const addPanel: ToolExecutor<{ panelId: string; sceneId: string }> = (ctx, params) => {
  const startTime = Date.now();

  // Validate parameters
  const validation = validateParams(AddPanelParamsSchema, params);
  if (!validation.success) {
    skillLogger.log({
      skill: 'storyboard',
      tool: 'add_panel',
      params,
      result: 'validation_error',
      error: formatValidationErrors(validation.errors),
      duration: Date.now() - startTime,
    });
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  // ... rest of existing code, but use validation.data instead of params
```

Repeat for each executor: `editPanel`, `deletePanel`, `drawSvg`, `reorderPanels`, `batchEdit`, `generateStoryboard`.

At end of each executor, after store operation:
```typescript
  skillLogger.log({
    skill: 'storyboard',
    tool: 'add_panel', // tool name
    params,
    result: result.success ? 'success' : 'failed',
    message: result.message,
    error: result.error,
    duration: Date.now() - startTime,
  });

  return result;
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/storyboard.ts
git commit -m "feat: integrate Zod validation and logging into storyboard skill

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Integrate validation into scenario skill

**Files:**
- Modify: `src/ai/skills/scenario.ts`

- [ ] **Step 1: Import schemas and logger, add validation to executors**

Add imports:
```typescript
import {
  EditScenarioParamsSchema,
  ExpandScenarioParamsSchema,
  CondenseScenarioParamsSchema,
  PolishScenarioParamsSchema,
} from './schemas';
import { validateParams, formatValidationErrors } from './registry';
import { skillLogger } from './logger';
```

Wrap each executor (`editScenario`, `expandScenario`, `condenseScenario`, `polishScenario`) with validation similar to storyboard skill.

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/scenario.ts
git commit -m "feat: integrate Zod validation and logging into scenario skill

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update storyboard prompt

**Files:**
- Modify: `src-tauri/prompts/copilot_storyboard.md`

- [ ] **Step 1: Rewrite with better tool descriptions**

Replace the Tools section with improved Korean descriptions. Keep the JSON response format, context variables, and user message placeholder unchanged.

Key improvements:
- Each tool has a Korean description explaining what it does
- Each parameter has Korean explanation with allowed values
- Add "When to use" guidance for each tool
- No examples (per user request)

- [ ] **Step 2: Commit**

```bash
git add src-tauri/prompts/copilot_storyboard.md
git commit -m "docs: improve copilot_storyboard prompt with Korean descriptions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Update scenario prompt

**Files:**
- Modify: `src-tauri/prompts/copilot_scenario.md`

- [ ] **Step 1: Rewrite with better tool descriptions**

Similar improvements to storyboard prompt - Korean descriptions, no examples.

- [ ] **Step 2: Commit**

```bash
git add src-tauri/prompts/copilot_scenario.md
git commit -m "docs: improve copilot_scenario prompt with Korean descriptions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Export schemas from index

**Files:**
- Modify: `src/ai/skills/index.ts`

- [ ] **Step 1: Add schema exports**

```typescript
export * from './types';
export * from './registry';
export * from './schemas';  // Add this
export * from './logger';   // Add this

// ... existing imports
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/index.ts
git commit -m "feat: export schemas and logger from skills module

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add zod dependencies | package.json |
| 2 | Create Zod schemas | schemas.ts |
| 3 | Create logger | logger.ts |
| 4 | Add validation helpers | registry.ts |
| 5 | Integrate into storyboard | storyboard.ts |
| 6 | Integrate into scenario | scenario.ts |
| 7 | Update storyboard prompt | copilot_storyboard.md |
| 8 | Update scenario prompt | copilot_scenario.md |
| 9 | Export schemas | index.ts |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing AI behavior | Test with existing prompts before shipping |
| Zod bundle size | Only import specific schemas needed |
| Schema mismatch with prompts | Keep schemas and prompts in sync during review |

---

## Dependencies

```bash
npm install zod zod-to-json-schema
```
