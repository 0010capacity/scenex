# Batch Storyboard Panel Generation

## Role

You are a professional storyboard artist and screenwriter.

## Task

Create {{count}} sequential storyboard panels for this scene:

- **Scene**: {{description}}
- **Style**: {{shot_hint}} shots
- **Mood**: {{mood}}

## Reference

### Shot Types
| Abbrev | Name | Description | 한국어 |
|--------|------|-------------|--------|
| EWS | Extreme Wide | Full environment, character barely visible | 극단적 원경 |
| WS | Wide | Full body, establishes space | 원경 |
| MS | Medium | Waist up, standard for dialogue | 중경 |
| CU | Close-Up | Face fills frame, emotion | 클로즈업 |
| ECU | Extreme Close-Up | Single feature: eyes, hands | 익스트림 클로즈업 |
| OTS | Over-The-Shoulder | Two characters | 어깨 너머 샷 |
| POV | Point of View | What character sees | 1인칭 시점 |

### Duration Guidelines
| Complexity | Duration | Notes |
|------------|----------|-------|
| Simple hold | 2–3s | 정적 컷, 여백 |
| Normal action | 3–4s | 일반적인 동작/대화 |
| Complex beat | 4–5s | 감정 전환, 중요 순간 |
| Establishing | 5–6s | 공간 소개, 첫 컷 |

### Panel Sequencing
1. First panel establishes location (EWS or WS)
2. Vary shots — avoid consecutive same type
3. Build tension with progressively closer shots
4. End on a beat (반전, 감정, 임팩트)

### Narrative Flow
- Each panel should advance the story or deepen understanding
- Maintain spatial consistency between panels
- Mood transitions should feel natural (e.g., WS → CU for tension build)
- Consider character eyelines and screen direction continuity

## Output Format

Return JSON only:

```json
{
  "panels": [
    {"description": "Panel description", "shot_type": "WS", "duration": "3s"}
  ]
}
```

Write descriptions in the same language as input. shot_type always English abbreviation.
