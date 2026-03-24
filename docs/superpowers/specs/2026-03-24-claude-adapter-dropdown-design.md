# Claude Adapter Status Dropdown — Design Spec

## Concept & Vision

타이틀바의 Claude Code 연결 상태를 표시하는 미니멀한 드롭다운. 앱의 Clean Studio 라이트 모드에 맞춰 흰 배경 + Indigo 액센트로 설계. 정보는 최소화하고 필요한 것만 보여주는实用的 팝업.

## Design Language

### Aesthetic Direction
- Clean Studio (Light Mode) 스타일 — macOS 설정 패널 같은 정돈된 느낌
- 아이콘 없음, 텍스트와 상태 배지만 사용
- 그림자와 border로 깊이 표현

### Color Palette (Light Mode)
```
Background:     #FFFFFF (bg1)
Surface:        #F5F5F4 (bg2)
Border:         #E5E5E3
Text Primary:   #1A1A1A
Text Secondary: #6B6B6B / #A0A0A0
Accent:         #4F46E5 (Indigo)
Green:          #16A34A (연결됨)
Red:            #DC2626 (연결 실패)
```

### Typography
- Font: DM Sans (app-wide)
- Sizes: 13px (title), 12px (body), 11px (status), 10px (meta)

### Spacing
- Panel padding: 12px
- Gap between elements: 10px
- Border radius: 10px (panel), 6px (buttons/inputs)

## Layout & Structure

```
┌─────────────────────────────────┐
│ Claude Code    ● 연결됨         │  ← Header row
├─────────────────────────────────┤
│ [Haiku ▼]  또는  [설치하기]   │  ← Action row
│ ────────         ────────      │
│ v1.0.42    ↻                  │  ← Meta row (optional)
└─────────────────────────────────┘
```

### States
- **연결됨**: 모델 선택 드롭다운 + 버전 + 새로고침 버튼
- **연결 실패**: 설치하기 버튼만
- **확인 중**: 상태만 표시 (로딩)

## Features & Interactions

### 연결됨 상태
1. 헤더: "Claude Code" + "● 연결됨" (초록)
2. 모델 선택: `<select>` dropdown — Haiku / Sonnet / Opus
3. Footer: 버전 + 새로고침 버튼 (↻)

### 연결 실패 상태
1. 헤더: "Claude Code" + "● 연결 실패" (빨강)
2. 설치하기 버튼 (Indigo 배경, 흰 텍스트)
3. 클릭 시 https://docs.anthropic.com/en/docs/claude-code 열림

### Hover/Focus States
- Select: border-color → #D0D0CC
- Buttons: subtle background shift
- Dropdown panel: subtle shadow increase

## Component Inventory

### Status Badge
- 상태 표시 (.ai-status 클래스 확장)
- ● 상태 인디케이터 (8px circle)
- 텍스트 색상이 상태에 따라 변경

### Dropdown Panel
- Position: absolute, top: calc(100% + 8px), right: 0
- Width: 260px
- Background: #FFFFFF
- Border: 1px solid #E5E5E3
- Border-radius: 10px
- Box-shadow: 0 4px 20px rgba(0,0,0,0.08)

### Model Select
- Native `<select>` for accessibility
- Background: #F5F5F4
- Border: 1px solid #E5E5E3
- Border-radius: 6px
- Padding: 8px 10px

### Install Button
- Background: #4F46E5 (Indigo)
- Text: #FFFFFF
- Border-radius: 6px
- Padding: 8px
- Full width

## Technical Approach

### State Management (Zustand)
```typescript
claudeStatus: 'checking' | 'available' | 'unavailable'
claudeModel: 'haiku' | 'sonnet' | 'opus'
```

### Dropdown Behavior
- Custom dropdown (no Mantine Popover) for reliability
- click-outside detection via ref + document event listener
- stopPropagation on dropdown click to prevent close

### Implementation Files
- `src/stores/uiStore.ts` — state management
- `src/components/layout/TitleBar.tsx` — dropdown UI
- `src/styles/global.css` — panel styling

## Design Mockups

라이트 모드 최종 디자인:
- 연결됨: 흰 패널, 초록 상태, 모델 셀렉트, 버전+새로고침
- 연결 실패: 흰 패널, 빨강 상태, 설치하기 버튼 (Indigo)
