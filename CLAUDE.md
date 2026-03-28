# Project: SceneX

## Overview

AI 기반 스토리보드/시나리오 작성 데스크톱 애플리케이션.
시나리오를 마크다운으로 작성하고 AI로 스토리보드 패널(SVG)을 생성.

## Commands

```bash
npm run dev          # Vite 개발 서버 (http://localhost:1420)
npm run build        # TypeScript 컴파일 + Vite 빌드
npm run test         # Vitest 실행
npm run test:watch   # Vitest watch 모드
npm run tauri:dev    # Tauri 개발 모드 (데스크톱 앱)
npm run tauri:build  # Tauri 프로덕션 빌드 (DMG)
```

## Stack

- **Frontend**: React 18, TypeScript, Vite 6
- **Desktop**: Tauri v2 (Rust)
- **UI**: Mantine v7, PostCSS, CSS Variables
- **State**: Zustand v5
- **Editor**: CodeMirror 6 (마크다운)
- **DnD**: @dnd-kit
- **Test**: Vitest 4, Testing Library

## Architecture

```
src/
├── ai/           # AI provider 팩토리, skills
├── components/   # UI 컴포넌트
│   ├── copilot/  # AI Copilot 사이드바
│   ├── inspector/# 패널 속성 에디터
│   ├── layout/   # TitleBar, Toolbar, Workspace
│   ├── panels/   # 패널 그리드, 모달
│   └── scenario/ # 시나리오 에디터
├── hooks/        # useClaude, useCopilot, useWorkspace
├── stores/       # Zustand (projectStore, uiStore, copilotStore)
├── types/        # TypeScript 타입
└── utils/        # markdownParser, duration

src-tauri/
├── src/commands/ # Tauri 커맨드 (claude, scenario, export, copilot)
└── prompts/      # AI 프롬프트 템플릿 ({{placeholder}} 치환)
```

## Conventions

- **Language**: 코드/코멘트는 영어, UI 텍스트와 프롬프트는 한국어 혼용
- **Styles**: Mantine + CSS Variables (`--var-name`), `light-mode` 클래스 사용
- **State**: Zustand with selectors (`useStore(s => s.value)`)
- **Types**: `src/types/index.ts`에서 export, 타입은 명시적 import
- **Prompts**: `src-tauri/prompts/`에 마크다운으로 저장, Rust에서 `include_str!` 로드

## Watch Out For

- **Claude CLI 의존**: AI 기능은 시스템에 `claude` CLI가 설치되어 있어야 작동
- **Tauri 플러그인**: clipboard, dialog, fs, shell 플러그인 사용 중
- **자동 저장**: 30초마다 자동 저장 + Git 자동 커밋
- **프로젝트 파일**: `.scenex` 확장자
- **마이그레이션**: 레거시 `project.scenes` → `project.scenario.scenes` 구조 변경됨
