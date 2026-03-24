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
