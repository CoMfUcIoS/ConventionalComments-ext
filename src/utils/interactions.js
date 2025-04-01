// Utility functions for handling interactions
import { debug } from "./debug";
import state from "../state";
import {
  updateStatus,
  updateActiveTextarea,
  resetDecorationButtons,
} from "../components/Panel";
import { togglePanel } from "../components/Panel";

/**
 * Listen for textareas getting focus to update active textarea
 */
export function setupTextareaListeners() {
  document.addEventListener("focusin", (e) => {
    if (e.target.tagName === "TEXTAREA") {
      if (state.activeTextarea !== e.target) {
        state.activeTextarea = e.target;
        updateStatus(`Active: ${getTextareaName(e.target)}`);

        // Clear active decorations
        state.activeDecorations.clear();
        resetDecorationButtons();
      }
    }
  });
}

/**
 * Define keyboard shortcut to toggle panel
 */
export function setupKeyboardShortcut() {
  document.addEventListener("keydown", (e) => {
    // Alt+C shortcut
    if (e.altKey && e.key === "c") {
      togglePanel();
    }
  });
}

/**
 * Get a readable name for a textarea
 * @param {HTMLElement} textarea The textarea to get a name for
 * @returns {string} A readable name for the textarea
 */
function getTextareaName(textarea) {
  if (!textarea) return "None";

  if (textarea.id === "new_comment_field") {
    return "Main Comment";
  } else if (textarea.id) {
    return textarea.id.replace(/_/g, " ").substring(0, 20);
  } else {
    return "Comment Field";
  }
}
