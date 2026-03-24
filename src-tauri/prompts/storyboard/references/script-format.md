# Script Format Reference

## Line Types

| Type | Purpose | Format |
|------|---------|--------|
| `action` | Scene/character description | No character field |
| `character` | Character name cue | UPPERCASE |
| `dialogue` | What character says | Normal case |
| `paren` | Parenthetical direction | Lowercase in parens |

## Location Headers

```
INT. LOCATION - TIME
EXT. LOCATION - TIME
INT./EXT. MOVING CAR - DAY
```

Examples:
- `INT. COFFEE SHOP - DAY`
- `EXT. ROOFTOP - EVENING`
- `INT./EXT. CAR - MOVING`

## Format Rules

1. **Action**: Present tense, visual, 1–3 sentences max
2. **Character**: UPPERCASE, precedes dialogue
3. **Dialogue**: Brief, natural, subtext over explicit
4. **Parenthetical**: Sparingly — manner only, not stage direction

## JSON Schema

```json
[
  {"line_type": "action", "text": "INT. LOCATION - DAY", "character": null},
  {"line_type": "action", "text": "Description of scene.", "character": null},
  {"line_type": "character", "text": "NAME", "character": "NAME"},
  {"line_type": "dialogue", "text": "Dialogue here.", "character": "NAME"},
  {"line_type": "paren", "text": "(quietly)", "character": "NAME"}
]
```

## Common Mistakes

- ❌ "Hello." / "How are you?" — avoid trivial exchanges
- ❌ Emotion statements: "She feels sad" — show it visually
- ❌ Overly long dialogue
- ❌ Every character sounds the same
- ❌ Inconsistent character name spelling
