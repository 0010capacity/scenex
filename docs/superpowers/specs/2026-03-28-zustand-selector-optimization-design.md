# Zustand Selector Optimization

**Issue**: #31
**Date**: 2026-03-28
**Status**: Approved

## Problem

Current Zustand store usage pattern subscribes components to the entire store, causing unnecessary re-renders when any store property changes.

### Current Pattern (Problematic)

```tsx
const { project, selectedSceneId, selectScene } = useProjectStore();
```

This pattern causes the component to re-render on **any** change to the store, even unrelated properties.

### Affected Files

25 files across the codebase use this pattern:
- `App.tsx`, `TitleBar.tsx`, `Toolbar.tsx` (top-level)
- `PanelCard.tsx`, `PanelGrid.tsx`, `InspectorPanel.tsx` (frequent updates)
- Modal components (lower priority)

## Solution

Use Zustand selectors to subscribe only to specific state slices.

### New Pattern

```tsx
// Subscribe only to needed values
const project = useProjectStore(state => state.project);
const selectedSceneId = useProjectStore(state => state.selectedSceneId);

// Actions don't need selectors - they're stable references
const selectScene = useProjectStore(state => state.selectScene);
```

### Why Inline Selectors

Chose inline selectors over pre-defined selector hooks because:
- Simpler to implement
- No additional abstraction layer needed
- Easy to understand and maintain
- Sufficient for project scale

## Implementation Priority

1. **High Priority** - Top-level components (largest impact)
   - `App.tsx`
   - `TitleBar.tsx`
   - `Toolbar.tsx`

2. **Medium Priority** - Frequently updating components
   - `PanelCard.tsx`
   - `PanelGrid.tsx`
   - `InspectorPanel.tsx`
   - `PanelCanvas.tsx`

3. **Low Priority** - Modal and less frequent components
   - `AddPanelModal.tsx`
   - `AiGenModal.tsx`
   - `ProjectBrowserModal.tsx`
   - Onboarding components

## Files to Modify

- `src/App.tsx`
- `src/components/layout/TitleBar.tsx`
- `src/components/layout/Toolbar.tsx`
- `src/components/layout/TabBar.tsx`
- `src/components/layout/Workspace.tsx`
- `src/components/layout/PanelCanvas.tsx`
- `src/components/layout/ScenarioSidebar.tsx`
- `src/components/panels/PanelCard.tsx`
- `src/components/panels/PanelGrid.tsx`
- `src/components/panels/SceneGroup.tsx`
- `src/components/panels/AddPanelModal.tsx`
- `src/components/panels/AiGenModal.tsx`
- `src/components/panels/ProjectBrowserModal.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/components/scenario/ScenarioEditor.tsx`
- `src/components/scenario/ScenarioAIGenerator.tsx`
- `src/components/scenario/ScenarioAIPanel.tsx`
- `src/components/onboarding/FirstProjectOnboarding.tsx`
- `src/hooks/useWorkspace.ts`
- `src/hooks/useClaude.ts`
- `src/hooks/useExport.ts`
- `src/hooks/useKeyboardShortcuts.ts`

## Expected Outcome

- Reduced unnecessary re-renders
- Better performance, especially during rapid state changes
- No functional changes to user experience
