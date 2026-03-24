# Prompt Writing Guide

프롬프트 설계 및 작성 가이드입니다.

---

## Philosophy

### 핵심 원칙

1. **Role은 짧게** — 1-2문장. Modern models는 role을 이해함.
2. **Task는 명확하게** — 무엇을 원하는지 직접적으로.
3. **Constraints는 구체적으로** — 모호한 요구 = 일관성 없는 출력.
4. **Output Format은 엄격하게** — "No markdown, start with X" 지시.
5. **Reference는 분리** — 깊이 있는 내용은 별도 파일로.
6. **Examples는 필요할 때만** — 복잡한 edge case에서만.

### 왜 이렇게 하는가

| Old Approach | New Approach | 이유 |
|-------------|--------------|------|
| 긴 role 설명 | 짧은 1-2문장 | Modern models의 zero-shot 능력 충분 |
| 모든 내용을 한 파일 | Role + Reference 분리 | 가독성, 재사용성 |
| Verbose anti-patterns | 제거 | Token 효율, readability |
| Many-shot examples | Zero-shot 기본 | Token 절약, 속도 |
| Inline tables | 간결하게 | 스캔 용이 |

---

## File Structure

```
prompts/
├── PROMPT_GUIDE.md           # 이 가이드
├── SKILL.md                  # 스킬 정의 (메타데이터)
├── svg_panel.md             # SVG 패널 생성 프롬프트
├── batch_panels.md         # 일괄 패널 생성 프롬프트
├── script_lines.md         # 스크립트 라인 생성 프롬프트
├── description_enhance.md   # 설명 개선 프롬프트
└── storyboard/
    ├── SKILL.md             # 스킬 정의 (참조용)
    └── references/
        ├── shot-types.md     # 샷 타입 참고 자료
        ├── svg-specs.md      # SVG 사양 참고 자료
        ├── duration.md        # 길이 가이드
        └── script-format.md   # 스크립트 형식
```

### 각 파일 역할

| 파일 | 목적 | 수정 빈도 |
|------|------|----------|
| `*.md` (메인 프롬프트) | 동적으로 build()되는 프롬프트 | 자주 변경 |
| `references/*.md` | 불변의 도메인 지식 |Rare 변경 |
| `SKILL.md` | 스킬 메타데이터 | 거의 변경 없음 |

---

## Prompt Template Structure

각 프롬프트는 다음 구조를 따릅니다:

```markdown
# [Prompt Name]

## Role

[1-2문장의 역할 정의]

## Task

[구체적인 작업 설명 — 매개변수 포함]

## Reference

[선택적: 핵심 내용만 요약]

## Output

[엄격한 출력 형식 요구사항]
```

### 예시: svg_panel.md

```markdown
# Storyboard SVG Generation

## Role

You are a professional storyboard artist creating rough thumbnail sketches.

## Task

Create a minimalist SVG storyboard sketch for this scene:

- **Description**: {{description}}
- **Shot Type**: {{shot_type}}
- **Mood**: {{mood}}

## Reference

### Shot Types
| Abbrev | Description |
|--------|-------------|
| EWS | Extreme Wide Shot — full environment |
| ... |

### SVG Specs
- viewBox: `0 0 640 360`
- stroke: `#222222`, stroke-width: `2–3`
- ...

## Output

Start with `<svg` and end with `</svg>`. No markdown fences. No explanation.
```

---

## Writing Rules

### 1. Role 정의

**Do:**
- 1-2문장
- 직관적인 역할명
- 전문 분야 명시

**Don't:**
- 5문장以上的 상세 설명
- "You are a helpful assistant"
- 모호한 특성 설명

### 2. Placeholder 형식

모든 동적 매개변수는 double curly brace 사용:

```markdown
{{description}}
{{shot_type}}
{{mood}}
{{count}}
```

Rust 코드에서 `.replace("{{key}}", value)`로 치환.

### 3. Reference Tables

간결하게. 5줄 이내로.

```markdown
### Shot Types
| Abbrev | Description |
|--------|-------------|
| WS | Wide Shot — full body |
```

### 4. Output Directive

매우 구체적으로:

```markdown
## Output

Start with `<svg` and end with `</svg>`. No markdown fences.
```

```markdown
## Output

Return JSON only:
```json
{"panels": [{"description": "...", "shot_type": "WS"}]}
```
```

### 5. Language Handling

입력이 한글이면 출력도 한글로 명시:

```markdown
If description is in Korean, create appropriate visuals.
```

---

## Adding a New Prompt

### Step 1: Prompt 파일 생성

```markdown
# [Name]

## Role

[역할]

## Task

[작업 — {{params}} 포함]

## Reference

[선택적: 관련 내용 요약]

## Output

[형식 요구사항]
```

### Step 2: Rust builder 추가

`src-tauri/src/commands/prompts.rs`:

```rust
pub mod new_prompt {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/new_prompt.md"),
        }
    }

    pub fn build(param1: &str, param2: &str) -> String {
        template()
            .replace("{{param1}}", param1)
            .replace("{{param2}}", param2)
    }
}
```

### Step 3: 테스트 추가

```rust
#[test]
fn test_new_prompt_replaces_placeholders() {
    let result = new_prompt::build("value1", "value2");
    assert!(result.contains("value1"));
    assert!(result.contains("value2"));
}
```

### Step 4: claude.rs에서 사용

```rust
use super::prompts;

let prompt = prompts::new_prompt::build(param1, param2);
```

---

## Version Management

현재는 단일 버전 (v1)만 사용.

### Version 추가가 필요한 경우

1. 파일명 뒤에 `_v2` 추가: `svg_panel_v2.md`
2. `prompts.rs`에 새 버전 매핑 추가:

```rust
pub enum PromptVersion {
    V1,
    V2,
}

pub mod svg_panel {
    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/svg_panel.md"),
            PromptVersion::V2 => include_str!("../../prompts/svg_panel_v2.md"),
        }
    }
}
```

3. 환경변수로 전환:

```bash
SCENEX_PROMPT_VERSION=v2
```

---

## Reference Files

`references/` 디렉토리의 파일은:

- **불변**: 프롬프트가 빌드될 때 포함되지 않음
- **LLM이 참조**: 프롬프트 내부에 짧은 요약만 포함
- **정확한 내용**: Shot type 정의, 스펙 등

### Reference 작성 규칙

- Markdown 제목 (`#`, `##`)만 사용
- 예시와 함께 설명
- 표 형식으로 정리
- 50줄 이내로 유지

---

## Testing

### Compile Test

```bash
cd src-tauri && cargo test --lib prompts
```

### Integration Test

실제 프롬프트 출력 테스트:

```rust
#[test]
fn test_svg_prompt_has_required_elements() {
    let prompt = svg_panel::build("test", Some("WS"), &[]);
    assert!(prompt.contains("viewBox"));
    assert!(prompt.contains("WS"));
}
```

### Manual Verification

```bash
claude --print "$(cat src-tauri/prompts/svg_panel.md | sed 's/{{description}}/test/g')"
```

---

## Best Practices Summary

| Do | Don't |
|----|-------|
| 짧은 role | Verbose role 설명 |
| 명확한 task | 모호한 요구사항 |
| 구체적 constraints | 포괄적 규칙 |
| 엄격한 output directive | 느슨한 형식 요구 |
| Reference 분리 | 모든 내용 한 파일 |
| 간결한 tables | 상세 나열 |
| 1-2 예시 (필요시) | Many-shot |

---

## Troubleshooting

### 출력 품질이 낮을 때

1. **Task가 모호** → 더 구체적으로 작성
2. **Constraints 부족** → 구체적 제한사항 추가
3. **Output directive 불명확** → 정확한 형식 명시

### 일관성 없는 출력

1. **Role 확인** → 너무 넓은 role 축소
2. **Examples 추가** → 복잡한 edge case에만
3. **Constraints 강화** → 반드시 지켜야 할 규칙 명시

### Token 초과

1. **Reference 제거** → 프롬프트 내부 요약으로 대체
2. **Tables 간결화** → 5줄 이내
3. **Role 축소** → 1문장으로
