# Rust Error Response Types Consistency

**Issue**: #32
**Date**: 2026-03-28
**Status**: Approved

## Problem

Current Rust commands have inconsistent error response patterns:
- Some use `success: bool + error: Option<String>` pattern
- Some return `Err(String)` directly
- No unified error type with error codes

### Current Inconsistencies

**claude.rs:**
```rust
GeneratePanelResponse {
    success: false,
    error: Some("Claude CLI not found...".to_string()),
}
```

**scenario.rs:**
```rust
GenerateScenarioResponse {
    success: false,
    error: Some(e),  // Inconsistent null handling
}
```

**file_io.rs:**
```rust
return Err("Failed to save project".to_string());  // Direct error return
```

## Solution

Create a unified `AppError` type with error codes.

### New Error Type

```rust
// src/error.rs
#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    // Claude-related
    ClaudeNotFound,
    ClaudeExecutionFailed,
    PromptGenerationFailed,

    // Project-related
    ProjectNotFound,
    ProjectSaveFailed,
    ProjectLoadFailed,

    // Input/validation
    InvalidInput,
    ValidationFailed,

    // General
    InternalError,
    IoError,
}
```

### Response Wrapper Pattern

```rust
// Use a result wrapper for all commands
#[derive(Debug, Serialize)]
pub struct CommandResult<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<AppError>,
}

impl<T> CommandResult<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(AppError::new(code, message)),
        }
    }
}
```

### Example Command Signature

```rust
#[command]
pub async fn generate_panel(
    request: GeneratePanelRequest
) -> CommandResult<GeneratePanelResponseData> {
    if request.description.is_empty() {
        return CommandResult::err(
            ErrorCode::InvalidInput,
            "Description cannot be empty"
        );
    }

    // ... implementation

    CommandResult::ok(GeneratePanelResponseData {
        svg_data: Some(svg_data),
        description: request.description,
    })
}
```

## Implementation Plan

1. **Create `src/error.rs`** with `AppError` and `ErrorCode` types
2. **Create `src/commands/result.rs`** with `CommandResult<T>` wrapper
3. **Update commands** in this order:
   - `claude.rs` (highest priority - most used)
   - `scenario.rs`
   - `file_io.rs`
   - `workspace.rs`
   - `export.rs`
4. **Update frontend** to handle new error structure

## Files to Modify

### Rust (src-tauri/src)
- `src/error.rs` (new)
- `src/commands/result.rs` (new)
- `src/commands/mod.rs` (add modules)
- `src/commands/claude.rs`
- `src/commands/scenario.rs`
- `src/commands/file_io.rs`
- `src/commands/workspace.rs`
- `src/commands/export.rs`

### Frontend
- `src/utils/invokeWrapper.ts` (update error handling)
- Type definitions for error responses

## Benefits

- Consistent error handling across all commands
- Error codes enable i18n error messages
- Structured error data enables detailed error UI
- Better debugging with error codes and details
