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
