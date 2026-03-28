# Scenario + Storyboard App Expansion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand SceneX from a storyboard-only app to a scenario+storyboard app with AI-powered scenario writing, version tracking, and bidirectional scenario↔storyboard generation.

**Architecture:**

This is a multi-session expansion with 4 independent subsystems. Each subsystem has its own detailed plan:

| Session | Subsystem | Plan File |
|--------|-----------|-----------|
| A | Types & Version Tracking | `2026-03-24-session-a-types-version.md` |
| B | AI Prompts Expansion | `2026-03-24-session-b-prompts.md` |
| C | AI UI Components | `2026-03-24-session-c-ui.md` |
| D | Scenario/Script Editor | `2026-03-24-session-d-scenario-editor.md` |

**Tech Stack:**
- Frontend: React + Zustand + Mantine UI
- Backend: Rust + Tauri
- AI: Claude CLI (`claude --print`)
- Storage: JSON project files + Zustand persist

**Data Model:**
```
Project
  └── scenarios: Scenario[]
        └── acts: Act[]
              └── scenes: Scene[]
                    └── panels: Panel[]
                          ├── version: number
                          ├── parentPanelId?: string
                          ├── generationMeta: {...}
                          └── svgData | imageData
```

**Key Changes:**

1. **Scenario/Script Layer** — Markdown editor for writing full scripts with act/scene structure
2. **Bidirectional Linkage** — Scenario → Storyboard and Storyboard → Scenario generation
3. **Version Tracking** — Every AI-generated item stores its version history; users can accept/reject changes
4. **AI Feature Expansion** — Scenario generation, polishing, condensing; panel regeneration with context
5. **Unified AI Store** — Single task queue with version tracking, lineage, and retry support

---

## Session Dependency Graph

```
Session A (Types)
    └── Session B (Prompts)  [needs types from A]
    └── Session D (Scenario Editor)  [needs types from A]
              └── Session C (UI)  [needs all of above]
```

**Recommended execution order:** A → B → D → C

---

## Summary of All Changes

### Session A: Types & Version Tracking
- New types: `Scenario`, `Act`, `PanelVersion`, `GenerationMetadata`
- Extended `Panel` with version fields
- Extended `aiStore` with new task types, parentTaskId, lineage tracking

### Session B: AI Prompts Expansion
- `scenario_generate.md` — concept → structured scenario
- `scenario_polish.md`, `scenario_expand.md`, `scenario_condense.md`
- `scenario_to_storyboard.md` — scenario → panel sequence
- `scenario_to_script.md` — scenario → script lines
- `regenerate_panel.md` — version-aware panel regeneration
- `panel_compare.md`, `scenario_compare.md`
- New Rust commands: `generate_scenario`, `regenerate_panel`, `compare_versions`

### Session C: AI UI Components
- `PanelHistoryDrawer.tsx` — version history sidebar
- `ScenarioAIGenerator.tsx` — high-level scenario AI modal
- Updates to `PanelCard`, `AiGenModal`, `AddPanelModal`
- Regenerate button with version context
- AI task tracking unified with `useAIStore`

### Session D: Scenario/Script Editor
- `ScenarioEditor.tsx` — act/scene hierarchy editor
- `ScenarioMarkdownEditor.tsx` — markdown editor for script writing
- `ScenarioAIPanel.tsx` — AI actions for scenario (generate, polish, etc.)
- Scenario → Storyboard conversion flow
- Storyboard → Scenario update flow

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `src/types/scenario.ts` | Scenario, Act types |
| `src/types/ai.ts` | AI task types, version types |
| `src/stores/aiStore.ts` (modified) | Extended with version tracking |
| `src/hooks/useScenarioAI.ts` | Scenario-level AI hooks |
| `src/components/scenario/ScenarioEditor.tsx` | Main scenario editor |
| `src/components/scenario/ScenarioMarkdownEditor.tsx` | Markdown editor |
| `src/components/scenario/ScenarioAIPanel.tsx` | AI actions panel |
| `src/components/panels/PanelHistoryDrawer.tsx` | Version history |
| `src-tauri/src/commands/scenario.rs` | Scenario Rust commands |
| `src-tauri/src/commands/versioning.rs` | Version commands |
| `prompts/scenario_generate.md` | Scenario generation |
| `prompts/scenario_polish.md` | Scenario polishing |
| `prompts/scenario_expand.md` | Scenario expansion |
| `prompts/scenario_condense.md` | Scenario condensing |
| `prompts/scenario_to_storyboard.md` | Scenario→storyboard |
| `prompts/scenario_to_script.md` | Scenario→script |
| `prompts/regenerate_panel.md` | Version-aware regeneration |
| `prompts/panel_compare.md` | Panel version comparison |
| `prompts/scenario_compare.md` | Scenario version comparison |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add PanelVersion, GenerationMetadata to Panel |
| `src/stores/aiStore.ts` | Add task types, version tracking |
| `src/stores/projectStore.ts` | Add scenario/act management |
| `src/hooks/useClaude.ts` | Add useAIStore integration, scenario functions |
| `src/components/panels/PanelCard.tsx` | Regenerate button, version badge |
| `src/components/panels/AiGenModal.tsx` | Scenario-level mode |
| `src/components/panels/AddPanelModal.tsx` | Version context for regeneration |
| `src-tauri/src/commands/claude.rs` | Add new AI commands |
| `src-tauri/src/commands/prompts.rs` | Add new prompt modules |
| `src-tauri/src/commands/mod.rs` | Export new modules |
| `src-tauri/src/lib.rs` | Register new commands |

---

## Architecture Notes

### Version Tracking Strategy
- Each `Panel` stores `version: number` (auto-incremented on AI regeneration)
- `parentPanelId?: string` tracks lineage (which panel this was regenerated from)
- `generationMeta` stores: prompt version, model, timestamp, duration
- `PanelVersion` history stored separately in project file (not in Panel itself)
- Accept = keep new version, Reject = restore previous version

### AI Command Pattern
All AI commands follow this pattern:
```rust
#[command]
pub async fn ai_command(request: Request) -> Response {
    let prompt = prompts::module::build(...);
    let output = run_claude(&prompt).await?;
    parse_and_validate(output)
}
```

### Version-Aware Prompts
When regenerating, the prompt includes:
```
## Previous Version
[old description or SVG]

## User Constraints
[what user wants different]

## Task
Generate improved version...
```

---

## Testing Strategy

### Unit Tests
- Prompt template `build()` functions — verify placeholder replacement
- Type serialization/deserialization
- Version increment logic

### Integration Tests
- End-to-end AI command tests (mock Claude CLI)
- Store action tests with mock prompts

### Manual Testing
- Generate scenario from concept
- Regenerate panel with version history
- Accept/reject workflow
- Scenario → Storyboard flow
- Storyboard → Scenario flow

---

## Rollback Strategy

If any session introduces breaking changes:
1. Revert the session's commit
2. The types/data model changes should be backward-compatible if done carefully
3. Prompt changes are additive only (new files, no deletions)
4. UI changes can be reverted if issues arise
