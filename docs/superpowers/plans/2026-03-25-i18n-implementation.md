# i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add internationalization (i18n) support with English and Korean, system language detection, and localStorage persistence.

**Architecture:** Use react-i18next with i18next-browser-languagedetector for system language detection. Store language preference in localStorage via Zustand persist middleware. All UI strings extracted to JSON translation files with TypeScript type safety.

**Tech Stack:** React, react-i18next, i18next-browser-languagedetector, Zustand, TypeScript

---

## File Structure

### New Files
```
src/
├── i18n/
│   ├── index.ts           # i18n initialization and configuration
│   └── locales/
│       ├── en.json        # English translations
│       └── ko.json        # Korean translations
```

### Modified Files
- `src/main.tsx` - Import i18n, wrap with Suspense
- `src/stores/uiStore.ts` - Add language preference
- `src/components/**/*.tsx` - Replace hardcoded strings with t() calls (~25 files)

---

## Task 1: Install Dependencies and Setup i18n Infrastructure

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/en.json`
- Create: `src/i18n/locales/ko.json`
- Modify: `src/main.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install i18n dependencies**

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

- [ ] **Step 2: Create i18n configuration**

Create `src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ko from './locales/ko.json';

export const SUPPORTED_LANGUAGES = ['en', 'ko'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'scenex-language',
    },
  });

export default i18n;
```

- [ ] **Step 3: Create initial translation files**

Create `src/i18n/locales/en.json`:

```json
{
  "common": {
    "cancel": "Cancel",
    "save": "Save",
    "add": "Add",
    "create": "Create",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "generating": "Generating...",
    "none": "None",
    "select": "Select"
  },
  "app": {
    "name": "SceneX",
    "tagline": "Storyboard Editor"
  }
}
```

Create `src/i18n/locales/ko.json`:

```json
{
  "common": {
    "cancel": "취소",
    "save": "저장",
    "add": "추가",
    "create": "생성",
    "delete": "삭제",
    "edit": "편집",
    "loading": "로딩 중...",
    "generating": "생성 중...",
    "none": "없음",
    "select": "선택"
  },
  "app": {
    "name": "SceneX",
    "tagline": "스토리보드 에디터"
  }
}
```

- [ ] **Step 4: Import i18n in main.tsx**

Modify `src/main.tsx` to add import at the top:

```typescript
import './i18n'; // Must be imported before App
```

- [ ] **Step 5: Verify i18n setup works**

```bash
npm run dev
```

Expected: App loads without errors in console.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ src/main.tsx package.json package-lock.json
git commit -m "feat: setup i18n infrastructure with react-i18next"
```

---

## Task 2: Add Language Preference to UI Store

**Files:**
- Modify: `src/stores/uiStore.ts`

- [ ] **Step 1: Add language preference to uiStore**

Add to the UIState interface and initial state:

```typescript
import { SupportedLanguage } from '../i18n';

interface UIState {
  // ... existing fields
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

// In initial state:
language: (localStorage.getItem('scenex-language') as SupportedLanguage) || 'en',

// Add action:
setLanguage: (lang) => {
  set({ language: lang });
  localStorage.setItem('scenex-language', lang);
  i18n.changeLanguage(lang);
},
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/uiStore.ts
git commit -m "feat: add language preference to uiStore"
```

---

## Task 3: Translate TitleBar Component

**Files:**
- Modify: `src/components/layout/TitleBar.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add TitleBar translations to JSON files**

Add to `en.json`:
```json
"titleBar": {
  "selectWorkspace": "Select workspace",
  "selectProject": "Select project",
  "claudeCode": "Claude Code",
  "connected": "Connected",
  "connectionFailed": "Connection Failed",
  "checking": "Checking...",
  "install": "Install",
  "scenario": "Scenario",
  "export": "Export",
  "exportPdf": "PDF Storyboard",
  "exportPdfDesc": "Print document",
  "exportImages": "Image ZIP",
  "exportImagesDesc": "Image package",
  "exportFcpxml": "Final Cut XML",
  "exportFcpxmlDesc": ".fcpxml file",
  "exportPremiere": "Premiere XML",
  "exportPremiereDesc": "For Adobe Premiere",
  "aiGenerate": "AI Generate"
}
```

Add to `ko.json`:
```json
"titleBar": {
  "selectWorkspace": "워크스페이스 선택",
  "selectProject": "프로젝트 선택",
  "claudeCode": "Claude Code",
  "connected": "연결됨",
  "connectionFailed": "연결 실패",
  "checking": "확인 중...",
  "install": "설치하기",
  "scenario": "시나리오",
  "export": "내보내기",
  "exportPdf": "PDF 스토리보드",
  "exportPdfDesc": "인쇄용 문서",
  "exportImages": "이미지 ZIP",
  "exportImagesDesc": "이미지 패키지",
  "exportFcpxml": "Final Cut XML",
  "exportFcpxmlDesc": ".fcpxml 파일",
  "exportPremiere": "Premiere XML",
  "exportPremiereDesc": "Adobe Premiere용",
  "aiGenerate": "AI 생성"
}
```

- [ ] **Step 2: Update TitleBar component to use translations**

Add import and use `useTranslation` hook:

```typescript
import { useTranslation } from 'react-i18next';

// In component:
const { t } = useTranslation();

// Replace all hardcoded strings with t('titleBar.keyName')
```

- [ ] **Step 3: Verify TitleBar translations work**

```bash
npm run dev
```

Expected: TitleBar displays in current language.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/TitleBar.tsx src/i18n/locales/*.json
git commit -m "feat(i18n): translate TitleBar component"
```

---

## Task 4: Translate Toolbar Component

**Files:**
- Modify: `src/components/layout/Toolbar.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add Toolbar translations**

Add to `en.json`:
```json
"toolbar": {
  "allScenes": "All Scenes",
  "grid": "Grid",
  "strip": "Strip",
  "slide": "Slide",
  "addScene": "Add Scene",
  "addPanel": "Add Panel",
  "inspector": "Inspector Panel",
  "newScene": "New Scene",
  "sceneName": "Scene name",
  "storyboard": "Storyboard"
}
```

Add to `ko.json`:
```json
"toolbar": {
  "allScenes": "전체 장면",
  "grid": "그리드",
  "strip": "스트립",
  "slide": "슬라이드",
  "addScene": "장면 추가",
  "addPanel": "패널 추가",
  "inspector": "속성 패널",
  "newScene": "새 장면 추가",
  "sceneName": "장면 이름",
  "storyboard": "스토리보드"
}
```

- [ ] **Step 2: Update Toolbar component**

- [ ] **Step 3: Verify and commit**

---

## Task 5: Translate PanelCanvas Component

**Files:**
- Modify: `src/components/layout/PanelCanvas.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add PanelCanvas translations**

Add to `en.json`:
```json
"panelCanvas": {
  "loading": "Loading...",
  "emptyProject": "Project is empty",
  "emptyProjectDesc": "Enter a scenario or auto-generate with AI"
}
```

Add to `ko.json`:
```json
"panelCanvas": {
  "loading": "로딩 중...",
  "emptyProject": "프로젝트가 비어있습니다",
  "emptyProjectDesc": "시나리오를 입력하거나 AI로 자동 생성하세요"
}
```

- [ ] **Step 2: Update PanelCanvas component**

- [ ] **Step 3: Verify and commit**

---

## Task 6: Translate ScenarioSidebar Component

**Files:**
- Modify: `src/components/layout/ScenarioSidebar.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add ScenarioSidebar translations**

Add to `en.json`:
```json
"scenarioSidebar": {
  "scenario": "Scenario",
  "linesAdded": "{{count}} scenario lines added",
  "generationFailed": "Scenario generation failed: {{error}}",
  "defaultSlugline": "INT. LOCATION — DAY",
  "emptyScenario": "No scenario content. Generate with AI below or type directly.",
  "selectScene": "Select a scene",
  "modifyPrompt": "Scenario modification request..."
}
```

Add to `ko.json`:
```json
"scenarioSidebar": {
  "scenario": "시나리오",
  "linesAdded": "{{count}}개의 시나리오 라인이 추가되었습니다",
  "generationFailed": "시나리오 생성 실패: {{error}}",
  "defaultSlugline": "INT. LOCATION — DAY",
  "emptyScenario": "시나리오 내용이 없습니다. 아래에서 AI를 통해 생성하거나 직접 입력하세요.",
  "selectScene": "장면을 선택하세요",
  "modifyPrompt": "시나리오 수정 요청..."
}
```

- [ ] **Step 2: Update ScenarioSidebar component**

- [ ] **Step 3: Verify and commit**

---

## Task 7: Translate AddPanelModal Component

**Files:**
- Modify: `src/components/panels/AddPanelModal.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add AddPanelModal translations**

Add to `en.json`:
```json
"addPanelModal": {
  "title": "Add Panel",
  "blankPanel": "Blank Panel",
  "blankPanelDesc": "Start with an empty frame. Type your description or add an image later.",
  "imageImport": "Image Import",
  "imageImportDesc": "Import JPG, PNG, PSD, PDF as panels. Sketches work too.",
  "aiGeneration": "AI Generation",
  "aiGenerationDesc": "Claude will generate storyboard description and camera settings for this panel.",
  "back": "Back",
  "shotType": "Shot Type",
  "duration": "Duration",
  "sceneDescription": "Scene Description",
  "sceneDescriptionOptional": "Scene Description (optional)",
  "dialogue": "Dialogue",
  "sound": "Sound",
  "mood": "Mood",
  "notSpecified": "Not specified",
  "durationExample": "e.g. 3s",
  "descriptionPlaceholder": "What happens in this frame?",
  "dropOrClick": "Drop files or click to select",
  "orPaste": "Or paste from clipboard",
  "clickToSelect": "Click to select another file",
  "aiPromptPlaceholder": "e.g. Close-up of Miso gazing out the window. She's daydreaming during class. Afternoon light streams through.",
  "shotTypeHint": "Shot Type Hint",
  "aiAutoDecide": "AI Auto Decide",
  "selectMethod": "Select a method",
  "addBlankPanel": "Add Blank Panel",
  "importComplete": "Import Complete",
  "selectFileFirst": "Select file to add",
  "generating": "Generating...",
  "aiGenerateAndAdd": "✦ AI Generate and Add",
  "fileReadError": "File read failed: {{error}}",
  "aiPanelCreated": "AI panel created",
  "aiPanelFailed": "AI panel generation failed: {{error}}"
}
```

Add to `ko.json`:
```json
"addPanelModal": {
  "title": "패널 추가",
  "blankPanel": "빈 패널",
  "blankPanelDesc": "빈 프레임으로 시작합니다. 텍스트로 설명을 직접 입력하거나 나중에 이미지를 추가할 수 있어요.",
  "imageImport": "이미지 임포트",
  "imageImportDesc": "JPG, PNG, PSD, PDF 등 외부 이미지를 패널로 가져옵니다. 직접 그린 스케치도 OK.",
  "aiGeneration": "AI 생성",
  "aiGenerationDesc": "설명을 입력하면 Claude가 이 패널에 맞는 스토리보드 설명과 카메라 설정을 자동으로 생성해요.",
  "back": "뒤로",
  "shotType": "샷 타입",
  "duration": "지속 시간",
  "sceneDescription": "장면 설명",
  "sceneDescriptionOptional": "장면 설명 (선택 사항)",
  "dialogue": "대사",
  "sound": "사운드",
  "mood": "분위기",
  "notSpecified": "지정 안 함",
  "durationExample": "예: 3s",
  "descriptionPlaceholder": "이 프레임에서 무슨 일이 일어나나요?",
  "dropOrClick": "파일을 드래그하거나 클릭해서 선택",
  "orPaste": "또는 클립보드에서 붙여넣기",
  "clickToSelect": "클릭하여 다른 파일 선택",
  "aiPromptPlaceholder": "예: 미소가 창밖을 바라보는 클로즈업. 수업 중이지만 딴생을 하고 있다. 오후의 빛이 창문을 통해 들어온다.",
  "shotTypeHint": "샷 타입 힌트",
  "aiAutoDecide": "AI 자동 결정",
  "selectMethod": "방식을 선택하세요",
  "addBlankPanel": "빈 패널 추가",
  "importComplete": "가져오기 완료",
  "selectFileFirst": "파일 선택 후 추가",
  "generating": "생성 중...",
  "aiGenerateAndAdd": "✦ AI 생성 후 추가",
  "fileReadError": "파일 읽기 실패: {{error}}",
  "aiPanelCreated": "AI 패널이 생성되었습니다",
  "aiPanelFailed": "AI 패널 생성 실패: {{error}}"
}
```

- [ ] **Step 2: Update AddPanelModal component**

- [ ] **Step 3: Verify and commit**

---

## Task 8: Translate AiGenModal Component

**Files:**
- Modify: `src/components/panels/AiGenModal.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add AiGenModal translations**

Add to `en.json`:
```json
"aiGenModal": {
  "title": "AI Batch Generation",
  "scene": "Scene",
  "scenario": "Scenario",
  "generateAll": "Generate entire scenario with AI",
  "sceneDescription": "Scene Description",
  "descriptionPlaceholder": "e.g. Two friends meet on the rooftop. Junhyuk gives Miso an ice cream and starts talking. The sunset paints the sky red.",
  "shotTypeHint": "Shot Type Hint",
  "panelCount": "Panel Count",
  "panels": "{{count}} panels",
  "generatingProgress": "Generating... {{progress}}%",
  "previewTitle": "Generated preview ({{count}} panels)",
  "generateStoryboard": "Generate Storyboard",
  "generationFailed": "AI generation failed: {{error}}",
  "generatingPanels": "Generating panels..."
}
```

Add to `ko.json`:
```json
"aiGenModal": {
  "title": "AI 일괄 생성",
  "scene": "장면",
  "scenario": "시나리오",
  "generateAll": "시나리오 전체를 AI로 생성하기",
  "sceneDescription": "장면 설명",
  "descriptionPlaceholder": "예: 옥상에서 만나는 두 친구. 준혁이 미소에게 아이스크림을 건네며 이야기를 시작한다. 노을이 지고 있고 도심의 붉은 빛이 하늘을 물들이고 있다.",
  "shotTypeHint": "샷 타입 힌트",
  "panelCount": "패널 개수",
  "panels": "{{count}}개",
  "generatingProgress": "생성 중... {{progress}}%",
  "previewTitle": "생성 미리보기 ({{count}}개 패널)",
  "generateStoryboard": "스토리보드 생성",
  "generationFailed": "AI 생성 실패: {{error}}",
  "generatingPanels": "Generating panels..."
}
```

- [ ] **Step 2: Update AiGenModal component**

- [ ] **Step 3: Verify and commit**

---

## Task 9: Translate PanelCard Component

**Files:**
- Modify: `src/components/panels/PanelCard.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add PanelCard translations**

Add to `en.json`:
```json
"panelCard": {
  "shotTypes": {
    "EWS": "Extreme Wide",
    "WS": "Wide",
    "MS": "Medium",
    "CU": "Close-Up",
    "ECU": "Extreme CU",
    "OTS": "Over-the-Shoulder",
    "POV": "POV"
  },
  "sources": {
    "ai": "AI",
    "manual": "Manual",
    "import": "Import",
    "empty": "Empty"
  },
  "emptyFrame": "Empty Frame",
  "edit": "Edit",
  "emptyPanel": "Empty Panel",
  "moveScene": "Move Scene",
  "noScenesToMove": "No scenes to move to",
  "regenerateAI": "Regenerate with AI",
  "versionHistory": "Version History"
}
```

Add to `ko.json`:
```json
"panelCard": {
  "shotTypes": {
    "EWS": "익스트림 와이드",
    "WS": "와이드",
    "MS": "미디엄",
    "CU": "클로즈업",
    "ECU": "익스트림 CU",
    "OTS": "오버더숄더",
    "POV": "시점"
  },
  "sources": {
    "ai": "AI",
    "manual": "수동",
    "import": "임포트",
    "empty": "빈 패널"
  },
  "emptyFrame": "빈 프레임",
  "edit": "편집",
  "emptyPanel": "빈 패널",
  "moveScene": "장면 이동",
  "noScenesToMove": "이동할 장면이 없습니다",
  "regenerateAI": "AI로 재생성",
  "versionHistory": "버전 기록"
}
```

- [ ] **Step 2: Update PanelCard component - replace SHOT_LABELS and SOURCE_LABELS constants**

- [ ] **Step 3: Verify and commit**

---

## Task 10: Translate PanelGrid Component

**Files:**
- Modify: `src/components/panels/PanelGrid.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add PanelGrid translations**

Add to `en.json`:
```json
"panelGrid": {
  "noPanels": "This scene has no panels yet.",
  "addPanel": "+ Add Panel",
  "aiAutoGenerate": "✦ Auto-generate with AI"
}
```

Add to `ko.json`:
```json
"panelGrid": {
  "noPanels": "이 장면에는 아직 패널이 없어요.",
  "addPanel": "+ 패널 추가",
  "aiAutoGenerate": "✦ AI로 자동 생성"
}
```

- [ ] **Step 2: Update PanelGrid component**

- [ ] **Step 3: Verify and commit**

---

## Task 11: Translate PanelHistoryDrawer Component

**Files:**
- Modify: `src/components/panels/PanelHistoryDrawer.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add PanelHistoryDrawer translations**

Add to `en.json`:
```json
"panelHistory": {
  "title": "Panel Version History",
  "noHistory": "No version history yet.",
  "description": "Description:",
  "model": "Model:",
  "duration": "Duration:",
  "restore": "Restore this version"
}
```

Add to `ko.json`:
```json
"panelHistory": {
  "title": "패널 버전 기록",
  "noHistory": "아직 버전 기록이 없습니다.",
  "description": "설명:",
  "model": "모델:",
  "duration": "지속 시간:",
  "restore": "이 버전 복원"
}
```

- [ ] **Step 2: Update PanelHistoryDrawer component**

- [ ] **Step 3: Verify and commit**

---

## Task 12: Translate ProjectBrowserModal Component

**Files:**
- Modify: `src/components/panels/ProjectBrowserModal.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add ProjectBrowserModal translations**

Add to `en.json`:
```json
"projectBrowser": {
  "title": "Project Browser",
  "workspaces": "Workspaces",
  "newWorkspace": "New Workspace",
  "noWorkspaces": "No workspaces yet",
  "projectsIn": "{{name}} Projects",
  "newProject": "New Project",
  "projectNamePlaceholder": "Project name",
  "noProjects": "No projects in this workspace",
  "selectWorkspace": "Select a workspace to view projects",
  "recent": "Recent",
  "workspaceLoadError": "Workspace load failed: {{error}}",
  "projectLoadError": "Project load failed: {{error}}"
}
```

Add to `ko.json`:
```json
"projectBrowser": {
  "title": "프로젝트 브라우저",
  "workspaces": "워크스페이스",
  "newWorkspace": "새 워크스페이스",
  "noWorkspaces": "워크스페이스가 없습니다",
  "projectsIn": "{{name}} 프로젝트",
  "newProject": "새 프로젝트",
  "projectNamePlaceholder": "프로젝트 이름",
  "noProjects": "이 워크스페이스에 프로젝트가 없습니다",
  "selectWorkspace": "프로젝트를 보려면 워크스페이스를 선택하세요",
  "recent": "최근",
  "workspaceLoadError": "워크스페이스 로드 실패: {{error}}",
  "projectLoadError": "프로젝트 로드 실패: {{error}}"
}
```

- [ ] **Step 2: Update ProjectBrowserModal component**

- [ ] **Step 3: Verify and commit**

---

## Task 13: Translate SceneGroup Component

**Files:**
- Modify: `src/components/panels/SceneGroup.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add SceneGroup translations**

Add to `en.json`:
```json
"sceneGroup": {
  "addPanel": "+ Panel"
}
```

Add to `ko.json`:
```json
"sceneGroup": {
  "addPanel": "+ 패널"
}
```

- [ ] **Step 2: Update SceneGroup component**

- [ ] **Step 3: Verify and commit**

---

## Task 14: Translate InspectorPanel Component

**Files:**
- Modify: `src/components/inspector/InspectorPanel.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add InspectorPanel translations**

Add to `en.json`:
```json
"inspector": {
  "title": "Properties",
  "selectPanelHint": "Select a panel to / edit properties",
  "panel": "Panel {{number}}",
  "frame": "Frame",
  "shotType": "Shot Type",
  "duration": "Duration",
  "cameraMovement": "Camera Movement",
  "content": "Content",
  "sceneDescription": "Scene Description",
  "dialogueNarration": "Dialogue / Narration",
  "sound": "Sound",
  "mood": "Mood",
  "transition": "Transition",
  "ai": "AI",
  "regeneratePanel": "Regenerate Panel with AI",
  "autoComplete": "Auto-complete Description",
  "panelRegenerated": "Panel regenerated with AI",
  "descriptionCompleted": "Description auto-completed",
  "regenerateFailed": "AI regeneration failed: {{error}}",
  "autoCompleteFailed": "Auto-complete failed: {{error}}"
}
```

Add to `ko.json`:
```json
"inspector": {
  "title": "속성",
  "selectPanelHint": "패널을 선택하면 / 속성을 편집할 수 있어요",
  "panel": "Panel {{number}}",
  "frame": "프레임",
  "shotType": "샷 타입",
  "duration": "지속 시간",
  "cameraMovement": "카메라 무브먼트",
  "content": "내용",
  "sceneDescription": "장면 설명",
  "dialogueNarration": "대사 / 나레이션",
  "sound": "사운드",
  "mood": "분위기",
  "transition": "전환",
  "ai": "AI",
  "regeneratePanel": "이 패널 AI 재생성",
  "autoComplete": "설명 자동 완성",
  "panelRegenerated": "패널이 AI로 재생성되었습니다",
  "descriptionCompleted": "설명이 자동 완성되었습니다",
  "regenerateFailed": "AI 재생성 실패: {{error}}",
  "autoCompleteFailed": "설명 자동 완성 실패: {{error}}"
}
```

- [ ] **Step 2: Update InspectorPanel component**

- [ ] **Step 3: Verify and commit**

---

## Task 15: Translate WorkspaceOnboarding Component

**Files:**
- Modify: `src/components/onboarding/WorkspaceOnboarding.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add WorkspaceOnboarding translations**

Add to `en.json`:
```json
"workspaceOnboarding": {
  "visualStoryboard": "Visual Storyboard",
  "aiAssistant": "AI Assistant",
  "projectManagement": "Project Management",
  "getStarted": "Get Started",
  "step": "Step {{current}} / {{total}}",
  "newWorkspace": "Create New Workspace",
  "openWorkspace": "Open Existing Workspace"
}
```

Add to `ko.json`:
```json
"workspaceOnboarding": {
  "visualStoryboard": "Visual Storyboard",
  "aiAssistant": "AI Assistant",
  "projectManagement": "Project Management",
  "getStarted": "시작하기",
  "step": "Step {{current}} / {{total}}",
  "newWorkspace": "새 워크스페이스 만들기",
  "openWorkspace": "기존 워크스페이스 열기"
}
```

- [ ] **Step 2: Update WorkspaceOnboarding component**

- [ ] **Step 3: Verify and commit**

---

## Task 16: Translate FirstProjectOnboarding Component

**Files:**
- Modify: `src/components/onboarding/FirstProjectOnboarding.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add FirstProjectOnboarding translations**

Add to `en.json`:
```json
"firstProject": {
  "workspace": "Workspace",
  "myWorkspace": "My Workspace",
  "title": "First Project",
  "subtitle": "Start your work",
  "blankProject": "Blank Project",
  "blankProjectDesc": "Script + Storyboard",
  "scriptFirst": "Script First",
  "scriptFirstDesc": "Start with script",
  "storyboardFirst": "Storyboard First",
  "storyboardFirstDesc": "Start with storyboard",
  "openExisting": "Open Existing Project",
  "recentProjects": "{{count}} recent projects",
  "noProjectsToOpen": "No projects to open",
  "projectName": "Project Name",
  "projectNamePlaceholder": "Enter project name"
}
```

Add to `ko.json`:
```json
"firstProject": {
  "workspace": "Workspace",
  "myWorkspace": "My Workspace",
  "title": "첫 프로젝트",
  "subtitle": "작업을 시작하세요",
  "blankProject": "빈 프로젝트",
  "blankProjectDesc": "스크립트 + 스토리보드",
  "scriptFirst": "스크립트 먼저",
  "scriptFirstDesc": "스크립트로 시작",
  "storyboardFirst": "스토리보드 먼저",
  "storyboardFirstDesc": "스토리보드로 시작",
  "openExisting": "기존 프로젝트 열기",
  "recentProjects": "{{count}}개의 최근 프로젝트",
  "noProjectsToOpen": "열 수 있는 프로젝트 없음",
  "projectName": "프로젝트 이름",
  "projectNamePlaceholder": "프로젝트 이름을 입력하세요"
}
```

- [ ] **Step 2: Update FirstProjectOnboarding component**

- [ ] **Step 3: Verify and commit**

---

## Task 17: Translate Scenario Editor Components

**Files:**
- Modify: `src/components/scenario/ActEditor.tsx`
- Modify: `src/components/scenario/ScenarioAIGenerator.tsx`
- Modify: `src/components/scenario/ScenarioAIPanel.tsx`
- Modify: `src/components/scenario/ScenarioEditor.tsx`
- Modify: `src/components/scenario/ScenarioMarkdownEditor.tsx`
- Modify: `src/components/scenario/SceneEditor.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add Scenario Editor translations**

Add to `en.json`:
```json
"scenario": {
  "scenes": "{{count}} scenes",
  "synopsis": "Synopsis",
  "synopsisPlaceholder": "Click to add synopsis...",
  "addScene": "Add Scene",
  "noSlugline": "No slugline",
  "panels": "{{count}} panels",
  "noDescription": "No description",
  "scenarios": "Scenarios",
  "new": "New",
  "acts": "{{count}} acts",
  "save": "Save",
  "aiActions": "AI Actions",
  "addAct": "Add Act",
  "noScenarioSelected": "No scenario selected",
  "createScenario": "Create Scenario",
  "writeMarkdown": "Write your scene script in markdown...",
  "scenarioName": "Scenario name:",
  "scenarioAi": {
    "title": "Scenario AI",
    "action": "AI Action",
    "selectAction": "Select an action",
    "polish": "Polish & Improve",
    "expand": "Expand / Flesh Out",
    "condense": "Condense / Tighten",
    "storyboard": "Generate Storyboard",
    "whatEachDoes": "What each action does:",
    "polishDesc": "Polish: Improve descriptions, pacing, flow",
    "expandDesc": "Expand: Add more scenes, deepen subplots",
    "condenseDesc": "Condense: Remove redundancy, tighten narrative",
    "storyboardDesc": "Storyboard: Generate panels from this scenario",
    "selectFirst": "Select a scenario to use AI actions.",
    "stats": "{{acts}} acts, {{scenes}} scenes",
    "processing": "Processing... {{progress}}%"
  },
  "generator": {
    "title": "AI Scenario Generator",
    "concept": "Concept",
    "conceptDesc": "Describe your story idea in a few sentences",
    "conceptPlaceholder": "A detective discovers that their memories are artificial...",
    "genre": "Genre",
    "selectGenre": "Select genre",
    "mood": "Mood",
    "selectMood": "Select mood",
    "genres": {
      "drama": "Drama",
      "thriller": "Thriller",
      "comedy": "Comedy",
      "horror": "Horror",
      "romance": "Romance",
      "scifi": "Sci-Fi"
    },
    "moods": {
      "dark": "Dark",
      "light": "Light",
      "nostalgic": "Nostalgic",
      "tense": "Tense",
      "uplifting": "Uplifting"
    },
    "generating": "Generating scenario... {{progress}}%",
    "generateButton": "Generate Scenario",
    "generatingTask": "Generating scenario..."
  }
}
```

Add to `ko.json`:
```json
"scenario": {
  "scenes": "{{count}}개 장면",
  "synopsis": "시놉시스",
  "synopsisPlaceholder": "클릭하여 시놉시스 추가...",
  "addScene": "장면 추가",
  "noSlugline": "슬러그라인 없음",
  "panels": "{{count}}개 패널",
  "noDescription": "설명 없음",
  "scenarios": "시나리오",
  "new": "새로 만들기",
  "acts": "{{count}}개 액트",
  "save": "저장",
  "aiActions": "AI 작업",
  "addAct": "액트 추가",
  "noScenarioSelected": "선택된 시나리오 없음",
  "createScenario": "시나리오 생성",
  "writeMarkdown": "마크다운으로 장면 스크립트 작성...",
  "scenarioName": "시나리오 이름:",
  "scenarioAi": {
    "title": "시나리오 AI",
    "action": "AI 작업",
    "selectAction": "작업 선택",
    "polish": "다듬기 & 개선",
    "expand": "확장 / 보강",
    "condense": "압축 / 정리",
    "storyboard": "스토리보드 생성",
    "whatEachDoes": "각 작업 설명:",
    "polishDesc": "다듬기: 설명, 페이싱, 흐름 개선",
    "expandDesc": "확장: 장면 추가, 서브플롯 심화",
    "condenseDesc": "압축: 중복 제거, 내러티브 정리",
    "storyboardDesc": "스토리보드: 이 시나리오로 패널 생성",
    "selectFirst": "AI 작업을 사용하려면 시나리오를 선택하세요.",
    "stats": "{{acts}}개 액트, {{scenes}}개 장면",
    "processing": "처리 중... {{progress}}%"
  },
  "generator": {
    "title": "AI 시나리오 생성기",
    "concept": "컨셉",
    "conceptDesc": "스토리 아이디어를 몇 문장으로 설명하세요",
    "conceptPlaceholder": "형사가 자신의 기억이 인공적이라는 것을 알게 된다...",
    "genre": "장르",
    "selectGenre": "장르 선택",
    "mood": "분위기",
    "selectMood": "분위기 선택",
    "genres": {
      "drama": "드라마",
      "thriller": "스릴러",
      "comedy": "코미디",
      "horror": "호러",
      "romance": "로맨스",
      "scifi": "SF"
    },
    "moods": {
      "dark": "어두운",
      "light": "밝은",
      "nostalgic": "향수적인",
      "tense": "긴장된",
      "uplifting": "고무적인"
    },
    "generating": "시나리오 생성 중... {{progress}}%",
    "generateButton": "시나리오 생성",
    "generatingTask": "Generating scenario..."
  }
}
```

- [ ] **Step 2: Update all scenario editor components**

- [ ] **Step 3: Verify and commit**

---

## Task 18: Translate AITaskStatus Component

**Files:**
- Modify: `src/components/AITaskStatus.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add AITaskStatus translations**

Add to `en.json`:
```json
"aiTaskStatus": {
  "waiting": "AI task waiting",
  "tasksCompleted": "{{count}} task completed",
  "tasksCompleted_plural": "{{count}} tasks completed",
  "tasksFailed": "{{count}} task failed",
  "tasksFailed_plural": "{{count}} tasks failed"
}
```

Add to `ko.json`:
```json
"aiTaskStatus": {
  "waiting": "AI 작업 대기중",
  "tasksCompleted": "{{count}}개 작업 완료",
  "tasksFailed": "{{count}}개 작업 실패"
}
```

- [ ] **Step 2: Update AITaskStatus component**

- [ ] **Step 3: Verify and commit**

---

## Task 19: Translate ProjectStore Strings

**Files:**
- Modify: `src/stores/projectStore.ts`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add projectStore translations**

Add to `en.json`:
```json
"projectStore": {
  "scene": "Scene",
  "defaultSlugline": "INT. LOCATION — DAY"
}
```

Add to `ko.json`:
```json
"projectStore": {
  "scene": "장면",
  "defaultSlugline": "INT. LOCATION — DAY"
}
```

- [ ] **Step 2: Update projectStore to use i18n for default scene name**

Note: Import i18n and use `i18n.t('projectStore.scene')` for the default scene name pattern.

- [ ] **Step 3: Verify and commit**

---

## Task 20: Add Language Toggle to UI

**Files:**
- Modify: `src/components/layout/TitleBar.tsx` (or appropriate settings location)
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: Add language toggle translations**

Add to `en.json`:
```json
"language": {
  "toggle": "Language",
  "en": "English",
  "ko": "한국어"
}
```

Add to `ko.json`:
```json
"language": {
  "toggle": "언어",
  "en": "English",
  "ko": "한국어"
}
```

- [ ] **Step 2: Add language toggle dropdown in TitleBar**

Add a language selector that uses `uiStore.setLanguage()`.

- [ ] **Step 3: Verify language switching works**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(i18n): add language toggle to TitleBar"
```

---

## Task 21: Final Verification and Testing

- [ ] **Step 1: Run full app test in English**

```bash
npm run dev
```

Test all components display correctly in English.

- [ ] **Step 2: Test language switching**

Switch to Korean, verify all strings change.

- [ ] **Step 3: Test localStorage persistence**

Refresh page, verify language preference is preserved.

- [ ] **Step 4: Test system language detection**

Clear localStorage, test with browser language set to Korean (should auto-detect).

- [ ] **Step 5: Check for any missing translations**

Search for any remaining hardcoded strings:

```bash
grep -r "\"[가-힣]" src/ --include="*.tsx" --include="*.ts"
```

Expected: No hardcoded Korean strings in components (only in translation files).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete i18n implementation with English and Korean support"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Setup i18n infrastructure | 4 new files |
| 2 | Add language to uiStore | 1 file |
| 3-18 | Translate components | ~20 files |
| 19 | Translate store strings | 1 file |
| 20 | Add language toggle | 1 file |
| 21 | Final verification | - |

**Total estimated changes:** ~25 files
