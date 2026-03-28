# Workspace / Project Manager Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Overview

Introduce a **Workspace → Project** hierarchy to SceneForge, enabling multi-project management within a single workspace. Each workspace is a git repository, and projects are subfolders within it.

---

## Data Model

### Workspace
- Physical folder on disk (e.g., `~/Documents/SceneX/영화 프로젝트`)
- Contains multiple project folders
- Is a git repository (auto-commits on save)

### Project
- Stored as a subfolder within the workspace: `~/Documents/SceneX/{workspace}/{project}/`
- Contains `.scenex` file and assets
- Each project maps to a single `.scenex` JSON file

### Current Project
- Single `.scenex` file per project: `{project}/{project}.scenex`

---

## UI Design

### TitleBar

```
┌─────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  영화 프로젝트 / 단편 영화 A ▼  │  Save  Export        │
└─────────────────────────────────────────────────────────────────┘
```

- **Left:** Traffic lights (close, minimize, maximize)
- **Center:** Project breadcrumb `workspace / project ▼` — clickable, opens modal
- **Right:** Save, Export buttons

### Project Browser Modal

```
┌───────────────────────────────────────────────────────────┐
│  Project Browser                                      ✕  │
├───────────────────────────────────────────────────────────┤
│  CURRENT WORKSPACE                                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  영화 프로젝트                          Switch ▼    │  │
│  │  ~/Documents/SceneX/영화 프로젝트                    │  │
│  └─────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────┤
│  PROJECTS IN "영화 프로젝트"                               │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  단편 영화 A                         [Current]      │  │
│  │  12 scenes / 48 panels / Updated 2h ago             │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  다큐멘터리 B                                       │  │
│  │  5 scenes / 20 panels / Updated yesterday           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  + New Project                                      │  │
│  └─────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────┤
│  [+ New Workspace]              [Open Project]             │
└───────────────────────────────────────────────────────────┘
```

### Design System (Light Mode Only)

| Token | Value |
|-------|-------|
| `--bg0` | `#FAFAF9` |
| `--bg1` | `#FFFFFF` |
| `--bg2` | `#F5F5F4` |
| `--bg3` | `#EEEEEC` |
| `--border` | `#E5E5E3` |
| `--text` | `#1A1A1A` |
| `--text2` | `#6B6B6B` |
| `--accent` | `#4F46E5` |
| `--gold` | `#4F46E5` |

**Fonts:** DM Sans (UI), DM Mono (code/labels), Playfair Display (headings)
**Icons:** @tabler/icons-react — IconFolder, IconFile, IconChevronDown, IconPlus, IconX, IconChevronUp/Down

---

## Flow

1. **App launch** → Load last opened project (stored in localStorage)
2. **Click project name in TitleBar** → Open Project Browser modal
3. **Select project** → Close modal, load selected project
4. **Save (Cmd+S)** → Save current project + auto git commit in workspace
5. **New Project** → Create folder + `.scenex` file, add to workspace

---

## Git Auto-Commit

- Each workspace folder is a git repository
- On project save: `git add .` → `git commit -m "Update {project}"`
- Commit message: `Update {project_name} — {timestamp}`

---

## File Structure

```
~/Documents/SceneX/
  {workspace_1}/
    .git/
    {project_1}/
      {project_1}.scenex
      assets/
    {project_2}/
      {project_2}.scenex
      assets/
  {workspace_2}/
    ...
```

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/TitleBar.tsx` | Add project breadcrumb, handle click → open modal |
| `src/components/panels/ProjectBrowserModal.tsx` | New component for workspace/project management |
| `src/stores/projectStore.ts` | Add workspace state, workspace/project selection |
| `src/stores/uiStore.ts` | Add `projectBrowserOpen` state |
| `src/hooks/useProject.ts` | Add workspace-aware save/load logic |
| `src-tauri/src/commands/file_io.rs` | Add workspace folder creation, git init |

---

## Verification

1. Open app → Should show last project or empty state
2. Click project name in TitleBar → Modal opens
3. Create new project → Folder created, shown in list
4. Save project → `.scenex` saved, git commit created
5. Switch workspace → Project list updates
6. Select different project → Project loads
