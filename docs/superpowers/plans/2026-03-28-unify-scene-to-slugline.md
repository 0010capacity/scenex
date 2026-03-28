# Unify Scene to Slugline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the separate "SCENE" badge type and unify `###` headings to only represent sluglines in scenario editor.

**Architecture:** Currently `###` headings are ambiguous - they could be either Scene or Slugline depending on content pattern. We simplify by treating all `###` as SLUG, matching traditional screenplay format where slugline = scene boundary.

**Tech Stack:** React, TypeScript, CodeMirror 6

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/scenario/scenarioDecorators.ts` | Remove SCENE badge type, all `###` → SLUG |
| `src/components/scenario/BadgeEditModal.tsx` | Remove SCENE case from UI |
| `src/components/scenario/ScenarioEditor.tsx` | Remove SCENE from condition |
| `src/components/layout/ScenarioSidebar.tsx` | Remove SCENE from condition |
| `src/ai/skills/scenario.ts` | Change `### New Scene` to slugline format |
| `src-tauri/prompts/copilot_scenario.md` | Update docs to reflect slugline-only format |
| `src/utils/markdownParser.ts` | Rename `scenes` count to `slugs` |

---

### Task 1: Remove SCENE Badge Type from scenarioDecorators.ts

**Files:**
- Modify: `src/components/scenario/scenarioDecorators.ts`

- [ ] **Step 1: Remove SCENE from BadgeType and BADGE_CONFIG**

```typescript
// Change line 10 from:
export type BadgeType = 'TITLE' | 'ACT' | 'SLUG' | 'SCENE' | 'NOTE' | 'GENRE' | 'MOOD';
// To:
export type BadgeType = 'TITLE' | 'ACT' | 'SLUG' | 'NOTE' | 'GENRE' | 'MOOD';
```

```typescript
// Remove SCENE entry from BADGE_CONFIG (line 17):
// DELETE this line:
SCENE: { text: 'SCENE', bgColor: 'color-mix(in srgb, var(--green) 12%, transparent)', textColor: 'var(--green)', borderColor: 'color-mix(in srgb, var(--green) 30%, transparent)' },
```

- [ ] **Step 2: Simplify `###` handling in buildDecorations()**

```typescript
// Replace lines 119-140 with:
} else if (lineText.startsWith('### ')) {
  // Slugline (scene boundary)
  builder.add(
    line.from,
    line.from,
    Decoration.widget({
      widget: new BadgeWidget('SLUG'),
      side: 1,
    })
  );
}
```

- [ ] **Step 3: Simplify getBadgeAtPos()**

```typescript
// Replace lines 182-184 with:
} else if (lineText.startsWith('### ')) {
  badgeType = 'SLUG';
}
```

- [ ] **Step 4: Remove unused isSlugline function**

Delete the `isSlugline` function (lines 23-27) as it's no longer needed.

- [ ] **Step 5: Commit**

```bash
git add src/components/scenario/scenarioDecorators.ts
git commit -m "refactor: remove SCENE badge, unify ### to SLUG only"
```

---

### Task 2: Remove SCENE from BadgeEditModal.tsx

**Files:**
- Modify: `src/components/scenario/BadgeEditModal.tsx`

- [ ] **Step 1: Remove SCENE from getModalTitle()**

```typescript
// Remove SCENE line from titles object (line 32):
const titles: Record<BadgeType, string> = {
  TITLE: '제목 수정',
  ACT: '대단원 수정',
  SLUG: '장면 위치 수정',
  // DELETE: SCENE: '소단위 수정',
  NOTE: '노트 수정',
  GENRE: '장르 수정',
  MOOD: '분위기 수정',
};
```

- [ ] **Step 2: Remove SCENE from placeholder logic**

```typescript
// Replace placeholder logic (lines 149-160) with:
placeholder={
  badgeInfo.badgeType === 'TITLE'
    ? '시나리오 제목'
    : badgeInfo.badgeType === 'ACT'
      ? '대단원 이름'
      : badgeInfo.badgeType === 'GENRE'
        ? '장르 (예: fantasy, thriller)'
        : badgeInfo.badgeType === 'MOOD'
          ? '분위기 (예: dark, bright)'
          : '노트 내용'
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/scenario/BadgeEditModal.tsx
git commit -m "refactor: remove SCENE case from BadgeEditModal"
```

---

### Task 3: Remove SCENE from ScenarioEditor.tsx

**Files:**
- Modify: `src/components/scenario/ScenarioEditor.tsx`

- [ ] **Step 1: Simplify badge type condition**

```typescript
// Change line 88 from:
} else if (info.badgeType === 'SLUG' || info.badgeType === 'SCENE') {
// To:
} else if (info.badgeType === 'SLUG') {
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scenario/ScenarioEditor.tsx
git commit -m "refactor: remove SCENE from ScenarioEditor badge handling"
```

---

### Task 4: Remove SCENE from ScenarioSidebar.tsx

**Files:**
- Modify: `src/components/layout/ScenarioSidebar.tsx`

- [ ] **Step 1: Simplify badge type condition**

```typescript
// Change line 127 from:
} else if (info.badgeType === 'SLUG' || info.badgeType === 'SCENE') {
// To:
} else if (info.badgeType === 'SLUG') {
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/ScenarioSidebar.tsx
git commit -m "refactor: remove SCENE from ScenarioSidebar badge handling"
```

---

### Task 5: Update AI Skill to Use Slugline Format

**Files:**
- Modify: `src/ai/skills/scenario.ts`

- [ ] **Step 1: Change scene expansion to use slugline format**

```typescript
// Change line 82 from:
updatedContent = scenario.content.trimEnd() + `\n\n### New Scene\n\n${newContent}\n`;
// To:
updatedContent = scenario.content.trimEnd() + `\n\n### INT./EXT. LOCATION - TIME\n\n${newContent}\n`;
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/skills/scenario.ts
git commit -m "refactor: change scene expansion to use slugline format"
```

---

### Task 6: Update Copilot Prompt Documentation

**Files:**
- Modify: `src-tauri/prompts/copilot_scenario.md`

- [ ] **Step 1: Update Scenario Content Format section**

```markdown
// Change line 17 from:
- `### Scene 1`, `### Scene 2`, etc. - Scene headers (H3)
// To:
- `### INT./EXT. LOCATION - TIME` - Sluglines (scene boundaries, H3)
```

- [ ] **Step 2: Commit**

```bash
git add src-tauri/prompts/copilot_scenario.md
git commit -m "docs: update copilot prompt to reflect slugline-only format"
```

---

### Task 7: Update markdownParser.ts

**Files:**
- Modify: `src/utils/markdownParser.ts`

- [ ] **Step 1: Rename scenes to slugs in countMarkdownSections**

```typescript
// Change function (lines 22-33) to:
export function countMarkdownSections(content: string): { acts: number; slugs: number } {
  const lines = content.split('\n');
  let acts = 0;
  let slugs = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) acts++;
    if (line.startsWith('### ')) slugs++;
  }

  return { acts, slugs };
}
```

- [ ] **Step 2: Update createEmptyScenario to use slugline format**

```typescript
// Change line 12 from:
content: `# ${name}\n\n## Act 1\n\n### Scene 1\n`,
// To:
content: `# ${name}\n\n## Act 1\n\n### INT. LOCATION - TIME\n`,
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/markdownParser.ts
git commit -m "refactor: rename scenes to slugs, update default format"
```

---

### Task 8: Update types/index.ts Default Scenario

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update default content format**

```typescript
// Change line 152 from:
content: `# ${name || '시나리오'}\n\n## Act 1\n\n### Scene 1\n`,
// To:
content: `# ${name || '시나리오'}\n\n## Act 1\n\n### INT. LOCATION - TIME\n`,
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: update default scenario to use slugline format"
```

---

### Task 9: Verify and Test

- [ ] **Step 1: Run TypeScript compiler**

```bash
npm run build
```

Expected: No type errors

- [ ] **Step 2: Run tests**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 3: Manual test in dev mode**

```bash
npm run tauri:dev
```

Verify:
1. Create new scenario - default content has slugline format
2. Type `### INT. OFFICE - DAY` - shows SLUG badge
3. Type `### Some random text` - also shows SLUG badge (no more SCENE)
4. Click SLUG badge - opens editor with location/time fields
5. "장면 추가" button inserts `### INT./EXT. 장소 - 시간`

- [ ] **Step 4: Final commit if needed**

```bash
git status
# Fix any remaining issues
git commit -m "fix: resolve any remaining SCENE references"
```
