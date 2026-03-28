use serde::{Deserialize, Serialize};

/// Error codes for consistent error handling across all commands
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

/// Unified error type for all commands
#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(code: ErrorCode, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: Some(details.into()),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        Self::with_details(ErrorCode::IoError, "IO error occurred", e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        Self::with_details(ErrorCode::ValidationFailed, "JSON parsing failed", e.to_string())
    }
}
