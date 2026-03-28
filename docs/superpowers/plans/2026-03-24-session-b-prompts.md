# Session B: AI Prompts Expansion

> **For agentic workers:** Execute tasks in order. Depends on Session A (types).

**Goal:** Create all new prompt files for scenario and version-aware AI features.

**Dependencies:**
- Requires types from Session A (`src/types/scenario.ts`, `src/types/ai.ts`)
- Prompt files are language-agnostic Markdown

---

## File Structure

### New Prompt Files (prompts/)
| File | Purpose |
|------|---------|
| `scenario_generate.md` | Generate structured scenario from concept |
| `scenario_polish.md` | Polish/improve existing scenario |
| `scenario_expand.md` | Expand short scenario |
| `scenario_condense.md` | Condense verbose scenario |
| `scenario_to_storyboard.md` | Convert scenario to panel sequence |
| `scenario_to_script.md` | Generate script from scenario content |
| `regenerate_panel.md` | Version-aware panel regeneration |
| `panel_compare.md` | Compare two panel versions |
| `scenario_compare.md` | Compare two scenario versions |

### New Rust Module
- Modify: `src-tauri/src/commands/prompts.rs` — add new prompt modules

### New Rust Commands
- Create: `src-tauri/src/commands/scenario.rs` — scenario AI commands
- Create: `src-tauri/src/commands/versioning.rs` — version comparison commands

---

## Task 1: scenario_generate.md

**Files:**
- Create: `prompts/scenario_generate.md`

- [ ] **Step 1: Write the prompt**

```markdown
# Scenario Generation

## Role

You are a professional screenwriter creating a structured scenario outline.

## Task

Generate a structured scenario from this concept:

- **Concept**: {{concept}}
- **Genre**: {{genre}}
- **Mood**: {{mood}}

## Output Format

Return JSON:

```json
{
  "title": "Scenario Title",
  "logline": "One-sentence summary",
  "acts": [
    {
      "name": "Act 1",
      "synopsis": "Brief act summary",
      "scenes": [
        {
          "name": "Scene 1",
          "slugline": "INT./EXT. LOCATION - TIME",
          "description": "What happens in this scene",
          "characters": ["CHAR1", "CHAR2"],
          "duration": "3-5 min"
        }
      ]
    }
  ],
  "estimatedDuration": "90 minutes"
}
```

## Guidelines

- **Genre**: Adapt structure to genre conventions (3-act for film, episodes for series)
- **Characters**: List 3-5 main characters with brief descriptions
- **Scenes**: Each act should have 3-6 scenes
- **Pacing**: Vary scene intensity across acts
- **Slugline format**: INT./EXT. LOCATION - TIME

If concept is in Korean, write output in Korean with Korean character names.

Return ONLY the JSON. No markdown fences.
```

- [ ] **Step 2: Add to prompts.rs**

In `prompts.rs`, add:

```rust
pub mod scenario_generate {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_generate.md"),
        }
    }

    pub fn build(concept: &str, genre: Option<&str>, mood: Option<&str>) -> String {
        template()
            .replace("{{concept}}", concept)
            .replace("{{genre}}", genre.unwrap_or("unspecified"))
            .replace("{{mood}}", mood.unwrap_or("neutral"))
    }
}
```

---

## Task 2: scenario_polish.md

**Files:**
- Create: `prompts/scenario_polish.md`

- [ ] **Write the prompt**

```markdown
# Scenario Polishing

## Role

You are a professional screenwriter polishing a scenario.

## Task

Improve this scenario to be more vivid, coherent, and dramatically effective:

**Original Scenario**:
{{scenario_json}}

## What to Improve

1. **Scene descriptions** — Make them more visual and cinematic
2. **Pacing** — Ensure dramatic beats are well-placed
3. **Character consistency** — Maintain character voices
4. **Flow** — Improve transitions between scenes
5. **Clarity** — Remove ambiguous descriptions

## What to Keep

- Original structure (number of acts and scenes)
- Original character names and core plot
- Original tone and mood

## Output

Return JSON with the same structure, only changing the content:

```json
{
  "title": "...",
  "logline": "...",
  "acts": [...]
}
```

Return ONLY the JSON. No markdown fences. If original was Korean, output Korean.
```

---

## Task 3: scenario_expand.md

**Files:**
- Create: `prompts/scenario_expand.md`

- [ ] **Write the prompt**

```markdown
# Scenario Expansion

## Role

You are a professional screenwriter expanding a short scenario.

## Task

Expand this short scenario into a full-featured scenario with more detail:

**Original**:
{{scenario_json}}

**Target expansion**: {{target_size}} (e.g., "add 2 more scenes per act", "add act break", "develop subplot")

## Output

Return JSON:

```json
{
  "title": "...",
  "logline": "...",
  "acts": [...]
}
```

Add scenes to deepen plot, develop characters, or build subplots. Each new scene should have:
- Clear slugline
- Visual description
- Character involvement
- Dramatic purpose

Return ONLY the JSON. No markdown fences. If original was Korean, output Korean.
```

---

## Task 4: scenario_condense.md

**Files:**
- Create: `prompts/scenario_condense.md`

- [ ] **Write the prompt**

```markdown
# Scenario Condensing

## Role

You are a professional screenwriter condensing a verbose scenario.

## Task

Condense this scenario to its essential beats:

**Original**:
{{scenario_json}}

**Target**: {{target_length}} (e.g., "50% shorter", "3 acts, 6 scenes total")

## Output

Return JSON:

```json
{
  "title": "...",
  "logline": "...",
  "acts": [...]
}
```

Keep only essential scenes that serve the core plot. Remove redundant descriptions, minor characters, and padding. Preserve the dramatic arc.

Return ONLY the JSON. No markdown fences. If original was Korean, output Korean.
```

---

## Task 5: scenario_to_storyboard.md

**Files:**
- Create: `prompts/scenario_to_storyboard.md`

- [ ] **Write the prompt**

```markdown
# Scenario to Storyboard

## Role

You are a professional storyboard artist converting a screenplay into visual panels.

## Task

Convert this scenario into a sequence of storyboard panels:

**Scenario**:
{{scenario_json}}

**Total panels**: {{panel_count}} (distribute across scenes)

## Panel Distribution

| Act | Scenes | Panels |
|-----|--------|--------|
{{distribution}}

## Output

Return JSON:

```json
{
  "panels": [
    {
      "sceneIndex": 0,
      "sceneName": "Scene 1",
      "description": "Visual description of the shot",
      "shotType": "WS",
      "duration": "3s",
      "mood": "emotional"
    }
  ]
}
```

## Shot Types
| Abbrev | Description |
|--------|-------------|
| EWS | Extreme Wide Shot |
| WS | Wide Shot |
| MS | Medium Shot |
| CU | Close-Up |
| ECU | Extreme Close-Up |
| OTS | Over-The-Shoulder |
| POV | Point of View |

## Guidelines

1. First panel of each scene: establishing shot (EWS/WS)
2. Vary shot types — avoid consecutive same type
3. Build tension with progressively closer shots
4. Each panel = 2-5 seconds of screen time
5. Total duration should match scene estimates

Return ONLY the JSON. No markdown fences. If scenario was Korean, output Korean descriptions.
```

---

## Task 6: scenario_to_script.md

**Files:**
- Create: `prompts/scenario_to_script.md`

- [ ] **Write the prompt**

```markdown
# Scenario to Script

## Role

You are a professional screenwriter generating dialogue and action from a scene outline.

## Task

Expand this scene into full script format:

**Scene**:
{{scene_json}}

## Format

```json
{
  "slugline": "INT./EXT. LOCATION - TIME",
  "scriptLines": [
    {"line_type": "action", "text": "Description of action", "character": null},
    {"line_type": "character", "text": "NAME", "character": "NAME"},
    {"line_type": "dialogue", "text": "Dialogue here.", "character": "NAME"},
    {"line_type": "paren", "text": "(quietly)", "character": "NAME"}
  ]
}
```

## Guidelines

- **Action lines**: Present tense, visual, 1-2 sentences
- **Dialogue**: Natural, subtext over explicit emotion
- **Parentheticals**: Sparingly — only for unclear manner
- **Duration**: Each script line ≈ 2-3 seconds

Return ONLY the JSON. No markdown fences. If scene was Korean, output Korean dialogue.
```

---

## Task 7: regenerate_panel.md

**Files:**
- Create: `prompts/regenerate_panel.md`

- [ ] **Write the prompt**

```markdown
# Panel Regeneration

## Role

You are a professional storyboard artist improving a panel.

## Task

Regenerate this panel based on user feedback:

**Previous Version**:
```
{{previous_svg}}
```

**Previous Description**: {{previous_description}}

**User Feedback**: {{user_feedback}}

**Scene Context**: {{scene_context}}

## Constraints

- viewBox: `0 0 640 360`
- Style: rough pencil thumbnail, consistent with scene
- Maintain character positions if mentioned in context
- Consider camera continuity with adjacent panels

## What to Change

Only apply what the user feedback requests. Don't change unrelated elements.

## Output

Start with `<svg` and end with `</svg>`. No markdown fences. No explanation.
```

---

## Task 8: panel_compare.md

**Files:**
- Create: `prompts/panel_compare.md`

- [ ] **Write the prompt**

```markdown
# Panel Comparison

## Role

You are a professional storyboard artist comparing two versions.

## Task

Compare these two panel versions and suggest improvements:

**Version A**:
```
{{version_a}}
```
Description: {{desc_a}}

**Version B**:
```
{{version_b}}
```
Description: {{desc_b}}

## Output

Return JSON:

```json
{
  "summary": "Brief comparison of both versions",
  "strengthsA": ["What A does well"],
  "strengthsB": ["What B does well"],
  "suggestedMerge": {
    "description": "Combined description",
    "approach": "Which SVG approach to use, or how to combine"
  },
  "recommendation": "A" | "B" | "merge"
}
```

Return ONLY the JSON. No markdown fences.
```

---

## Task 9: scenario_compare.md

**Files:**
- Create: `prompts/scenario_compare.md`

- [ ] **Write the prompt**

```markdown
# Scenario Comparison

## Role

You are a professional screenwriter comparing two scenario versions.

## Task

Compare these two scenarios and summarize the changes:

**Version A**:
{{version_a}}

**Version B**:
{{version_b}}

## Output

Return JSON:

```json
{
  "summary": "Overall comparison",
  "changes": {
    "added": ["New scenes or elements in B"],
    "removed": ["Scenes or elements removed from A"],
    "modified": ["Changed elements"]
  },
  "improvements": ["What B does better"],
  "concerns": ["Potential issues with B"],
  "recommendation": "A" | "B" | "merge"
}
```

Return ONLY the JSON. No markdown fences.
```

---

## Task 10: Create scenario.rs Rust commands

**Files:**
- Create: `src-tauri/src/commands/scenario.rs`

- [ ] **Write commands**

```rust
use serde::{Deserialize, Serialize};
use tauri::command;

use super::prompts;
use super::claude::run_claude;

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateScenarioRequest {
    pub concept: String,
    pub genre: Option<String>,
    pub mood: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScenarioOutput {
    pub title: String,
    pub logline: String,
    pub acts: Vec<ActOutput>,
    pub estimated_duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActOutput {
    pub name: String,
    pub synopsis: String,
    pub scenes: Vec<SceneOutput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SceneOutput {
    pub name: String,
    pub slugline: String,
    pub description: String,
    pub characters: Vec<String>,
    pub duration: Option<String>,
}

#[command]
pub async fn generate_scenario(request: GenerateScenarioRequest) -> Result<ScenarioOutput, String> {
    let prompt = prompts::scenario_generate::build(
        &request.concept,
        request.genre.as_deref(),
        request.mood.as_deref(),
    );

    let output = run_claude(&prompt).await?;
    let scenario: ScenarioOutput = serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse scenario: {}", e))?;

    Ok(scenario)
}

// Similar commands for:
// - regenerate_panel
// - compare_versions
// - scenario_to_storyboard
// - scenario_to_script
```

- [ ] **Step 2: Add run_claude helper to claude.rs**

In `claude.rs`, extract the common Claude execution:

```rust
pub async fn run_claude(prompt: &str) -> Result<String, String> {
    let claude_path = which::which("claude")
        .map_err(|_| "Claude CLI not found")?;

    let output = Command::new(&claude_path)
        .arg("--print")
        .arg(prompt)
        .output()
        .await
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
```

---

## Task 11: Update commands/mod.rs

**Files:**
- Modify: `src-tauri/src/commands/mod.rs`

- [ ] **Add new modules**

```rust
pub mod claude;
pub mod export;
pub mod file_io;
pub mod prompts;
pub mod scenario;
pub mod workspace;
```

---

## Task 12: Register new commands in lib.rs

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Add to invoke_handler**

```rust
invoke_handler![
    commands::claude::check_claude_available,
    commands::claude::generate_panel,
    commands::claude::generate_script_lines,
    commands::claude::generate_description_suggestion,
    commands::claude::batch_generate_panels,
    commands::scenario::generate_scenario,
    commands::scenario::regenerate_panel,
    commands::scenario::compare_versions,
    commands::scenario::scenario_to_storyboard,
    commands::scenario::scenario_to_script,
    // ... other commands
]
```

---

## Task 13: Commit

```bash
git add \
  prompts/scenario_generate.md \
  prompts/scenario_polish.md \
  prompts/scenario_expand.md \
  prompts/scenario_condense.md \
  prompts/scenario_to_storyboard.md \
  prompts/scenario_to_script.md \
  prompts/regenerate_panel.md \
  prompts/panel_compare.md \
  prompts/scenario_compare.md \
  src-tauri/src/commands/scenario.rs \
  src-tauri/src/commands/prompts.rs \
  src-tauri/src/commands/mod.rs \
  src-tauri/src/lib.rs
git commit -m "feat(prompts): add scenario and version-aware AI prompts

New prompts:
- scenario_generate: concept to structured scenario
- scenario_polish/expand/condense: scenario editing
- scenario_to_storyboard: scenario to panel sequence
- scenario_to_script: scenario to script lines
- regenerate_panel: version-aware panel regeneration
- panel_compare/scenario_compare: version diff

New Rust commands:
- generate_scenario
- regenerate_panel
- compare_versions
- scenario_to_storyboard
- scenario_to_script

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
