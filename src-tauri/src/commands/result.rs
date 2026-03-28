use serde::Serialize;
use crate::error::{AppError, ErrorCode};

/// Unified result wrapper for all commands
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

    pub fn err_with_details(code: ErrorCode, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(AppError::with_details(code, message, details)),
        }
    }
}
