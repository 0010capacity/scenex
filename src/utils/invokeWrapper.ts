/**
 * Invoke wrapper that handles page reload gracefully.
 * Prevents "Couldn't find callback id" errors when Tauri invokes
 * complete after the webview context has been destroyed.
 */

import { invoke } from '@tauri-apps/api/core';

// Flag set during page unload
let isUnloading = false;

// Initialize beforeunload listener
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isUnloading = true;
  });

  // Also handle pagehide for more reliable detection
  window.addEventListener('pagehide', () => {
    isUnloading = true;
  });
}

/**
 * Invoke wrapper that skips calls during unload and gracefully handles
 * "Couldn't find callback id" errors that occur when the webview reloads
 * while Rust async operations are still pending.
 */
export async function invokeWrapper<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  // Skip invoke during unload to prevent orphaned callbacks
  if (isUnloading) {
    return null;
  }

  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    // Check if this is a callback ID error (webview was reloaded)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("Couldn't find callback id") ||
      errorMessage.includes('callback id')
    ) {
      // Silently ignore - this is expected during reload
      console.debug('[invokeWrapper] Ignoring callback error during reload:', cmd);
      return null;
    }

    // For other errors, re-throw so calling code can handle them
    throw error;
  }
}

// Re-export invoke for cases where wrapping is not needed
export { invoke };
