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
