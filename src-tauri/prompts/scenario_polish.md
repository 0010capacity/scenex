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
