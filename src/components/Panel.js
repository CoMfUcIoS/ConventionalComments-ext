import { debug } from "../utils/debug";
import state from "../state";
import {
  LABELS,
  DECORATIONS,
  LABEL_INFO,
  DECORATION_INFO,
} from "../utils/constants";
import {
  saveExpandState,
  updateExpandState,
  applyPanelPosition,
  resetPanelPosition,
  savePanelPosition,
} from "../utils/storage";
import { showHelp } from "./HelpDialog";
import { addThemeSwitcher } from "./ThemeSwitcher";

/**
 * Create and inject the floating panel
 * @returns {HTMLElement} The created panel
 */
export function createPanel() {
  debug("Creating conventional comments panel");

  // Check if panel already exists
  if (state.panel) {
    debug("Panel already exists, not creating another one");
    return state.panel;
  }

  // Create container
  const panel = document.createElement("div");
  panel.id = "conventional-comments-panel";
  panel.classList.add("cc-panel");

  // Create header with move handle
  const header = document.createElement("div");
  header.classList.add("cc-panel-header");

  const title = document.createElement("div");
  title.textContent = "Conventional Comments";
  title.classList.add("cc-panel-title");

  const controls = document.createElement("div");
  controls.classList.add("cc-panel-controls");

  // Create reset position button
  const resetPositionBtn = document.createElement("button");
  resetPositionBtn.textContent = "⟲";
  resetPositionBtn.classList.add("cc-control-button");
  resetPositionBtn.title = "Reset Position";
  resetPositionBtn.style.marginRight = "5px";

  // Create help button
  const helpButton = document.createElement("button");
  helpButton.textContent = "?";
  helpButton.classList.add("cc-control-button");
  helpButton.title = "Help";

  // Create toggle button
  const toggleButton = document.createElement("button");
  toggleButton.textContent = state.isExpanded ? "▼" : "▲";
  toggleButton.classList.add("cc-control-button");
  toggleButton.title = state.isExpanded ? "Collapse" : "Expand";

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.classList.add("cc-control-button");
  closeButton.title = "Hide Panel";

  // Add event listeners - IMPORTANT: add them when we create the buttons
  resetPositionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetPanelPosition();
    debug("Reset panel position button clicked");
  });

  helpButton.addEventListener("click", (e) => {
    showHelp(e);
    debug("Help button clicked");
  });

  toggleButton.addEventListener("click", (e) => {
    toggleExpand(e);
    debug("Toggle expand button clicked");
  });

  closeButton.addEventListener("click", () => {
    hidePanel();
    debug("Close button clicked");
  });

  controls.appendChild(resetPositionBtn);
  controls.appendChild(helpButton);
  controls.appendChild(toggleButton);
  controls.appendChild(closeButton);

  header.appendChild(title);
  header.appendChild(controls);
  panel.appendChild(header);

  // Create content container
  const content = document.createElement("div");
  content.id = "conventional-comments-content";
  content.classList.add("cc-content");

  // Add labels section
  const labelsTitle = document.createElement("div");
  labelsTitle.textContent = "Labels";
  labelsTitle.classList.add("cc-section-title");
  labelsTitle.id = "cc-labels-title";
  content.appendChild(labelsTitle);

  const labelsContainer = document.createElement("div");
  labelsContainer.classList.add("cc-button-container");
  labelsContainer.id = "cc-labels-container";

  // Add labels section with button event listeners
  const labelsToUse = state.customLabels || LABELS;
  labelsToUse.forEach((label) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.dataset.label = label;
    button.className = "cc-label-btn";

    // Add tooltip
    if (LABEL_INFO[label]) {
      button.title = LABEL_INFO[label];
    }

    button.addEventListener("click", () => {
      insertLabel(label);
    });

    labelsContainer.appendChild(button);
  });

  // Add "+" button for customizing labels
  const { addLabelsCustomizeButton } =
    window.conventionalCommentsExtensionAPI || {};
  if (addLabelsCustomizeButton) {
    addLabelsCustomizeButton(labelsContainer);
  }

  content.appendChild(labelsContainer);

  // Add decorations section
  const decorationsTitle = document.createElement("div");
  decorationsTitle.textContent = "Decorations";
  decorationsTitle.classList.add("cc-section-title");
  decorationsTitle.id = "cc-decorations-title";
  content.appendChild(decorationsTitle);

  const decorationsContainer = document.createElement("div");
  decorationsContainer.classList.add("cc-button-container");
  decorationsContainer.id = "cc-decorations-container";

  const decorationsToUse = state.customDecorations || DECORATIONS;
  decorationsToUse.forEach((decoration) => {
    const button = document.createElement("button");
    button.textContent = decoration;
    button.dataset.decoration = decoration;
    button.className = "cc-decoration-btn";

    // Add tooltip
    if (DECORATION_INFO[decoration]) {
      button.title = DECORATION_INFO[decoration];
    }

    button.addEventListener("click", () =>
      toggleDecoration(decoration, button),
    );

    decorationsContainer.appendChild(button);
  });

  // Add "+" button for customizing decorations
  const { addDecorationsCustomizeButton } =
    window.conventionalCommentsExtensionAPI || {};
  if (addDecorationsCustomizeButton) {
    addDecorationsCustomizeButton(decorationsContainer);
  }

  content.appendChild(decorationsContainer);

  // Add footer with status
  const footer = document.createElement("div");
  footer.classList.add("cc-footer");

  const statusText = document.createElement("div");
  statusText.id = "cc-status-text";
  statusText.textContent = "No active text area";

  footer.appendChild(statusText);

  // Put everything together
  panel.appendChild(content);
  panel.appendChild(footer);
  document.body.appendChild(panel);

  // Store panel reference
  state.panel = panel;

  // Apply saved position
  applyPanelPosition();

  // Update expand state
  updateExpandState();

  // Make panel draggable - use our own direct implementation
  makePanelDraggable(panel, header);

  // Add theme switcher - only add it once
  addThemeSwitcher();

  debug(
    "Conventional comments panel created with customization buttons and explicit IDs",
  );

  return panel;
}

/**
 * Make panel draggable by handle
 * @param {HTMLElement} panel The panel element
 * @param {HTMLElement} handle The handle element
 */
function makePanelDraggable(panel, handle) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  const DRAG_THRESHOLD = 3;
  let initialDx = 0,
    initialDy = 0;
  let hasMoved = false;

  handle.addEventListener("mousedown", startDrag);
  debug("Added mousedown listener to panel handle");

  function startDrag(e) {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Don't start drag if clicked on a button
    if (e.target.tagName === "BUTTON") return;

    e.preventDefault();
    e.stopPropagation();

    isDragging = false;
    hasMoved = false;

    // Get starting cursor position
    startX = e.clientX;
    startY = e.clientY;

    // Get starting element position
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Add event listeners
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    debug("Added drag event listeners to document for panel");
  }

  function onDrag(e) {
    // Calculate the distance moved
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // If we haven't moved beyond the threshold, don't start dragging yet
    if (!isDragging) {
      // Check if we've moved beyond the threshold
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        isDragging = true;

        // Store initial position difference to prevent jump
        initialDx = dx;
        initialDy = dy;

        // Add dragging class for visual feedback
        panel.classList.add("cc-dragging");
        debug("Drag threshold exceeded, starting panel drag");
      } else {
        return;
      }
    }

    e.preventDefault();
    hasMoved = true;

    // Adjust for initial jump
    const adjustedDx = dx - initialDx;
    const adjustedDy = dy - initialDy;

    // Convert to pure position-based positioning
    const newLeft = Math.max(0, startLeft + adjustedDx);
    const newTop = Math.max(0, startTop + adjustedDy);

    // Constrain to viewport
    const maxLeft = window.innerWidth - panel.offsetWidth;
    const maxTop = window.innerHeight - panel.offsetHeight;

    const constrainedLeft = Math.min(newLeft, maxLeft);
    const constrainedTop = Math.min(newTop, maxTop);

    // Update element position
    panel.style.left = `${constrainedLeft}px`;
    panel.style.top = `${constrainedTop}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";

    // Update state
    state.position = {
      left: `${constrainedLeft}px`,
      top: `${constrainedTop}px`,
    };
  }

  function stopDrag() {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);

    // Remove dragging class
    panel.classList.remove("cc-dragging");

    if (isDragging && hasMoved) {
      // If we were dragging, save the position
      savePanelPosition();
    }

    isDragging = false;
    debug("Panel drag stopped");
  }
}

/**
 * Toggle panel visibility
 */
export function togglePanel() {
  if (state.visible) {
    hidePanel();
  } else {
    showPanel();
  }
}

/**
 * Show the panel
 */
export function showPanel() {
  debug("Showing panel");

  // Create panel if it doesn't exist
  if (!state.panel) {
    createPanel();
  }

  // Update textarea status
  updateActiveTextarea();

  // Show panel
  state.panel.style.display = "block";
  state.visible = true;
}

/**
 * Hide the panel
 */
export function hidePanel() {
  debug("Hiding panel");

  if (state.panel) {
    state.panel.style.display = "none";
  }

  state.visible = false;
}

/**
 * Toggle expanded state
 * @param {Event} e The click event
 */
export function toggleExpand(e) {
  if (e) e.stopPropagation();

  state.isExpanded = !state.isExpanded;
  updateExpandState();
  saveExpandState();
  debug(`Panel expanded state toggled to: ${state.isExpanded}`);
}

/**
 * Insert a label into the active textarea
 * @param {string} label The label to insert
 */
export function insertLabel(label) {
  debug(`Inserting label: ${label}`);

  if (!state.activeTextarea) {
    debug("No active textarea, can't insert label");
    return;
  }

  const textarea = state.activeTextarea;
  const currentValue = textarea.value;
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;

  const newText = `${label}: `;
  textarea.value =
    currentValue.slice(0, selectionStart) +
    newText +
    currentValue.slice(selectionEnd);

  textarea.selectionStart = selectionStart + newText.length;
  textarea.selectionEnd = selectionStart + newText.length;
  textarea.focus();

  // Clear active decorations
  state.activeDecorations.clear();
  resetDecorationButtons();

  // Trigger input event to ensure GitHub registers the change
  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  debug(`Label inserted: ${label}`);
}

/**
 * Toggle a decoration
 * @param {string} decoration The decoration to toggle
 * @param {HTMLElement} button The button that was clicked
 */
export function toggleDecoration(decoration, button) {
  debug(`Toggling decoration: ${decoration}`);

  if (!state.activeTextarea) {
    debug("No active textarea, can't toggle decoration");
    return;
  }

  // Toggle in active set
  const isActive = state.activeDecorations.has(decoration);

  if (isActive) {
    state.activeDecorations.delete(decoration);
    button.classList.remove("active");
  } else {
    state.activeDecorations.add(decoration);
    button.classList.add("active");
  }

  // Update textarea
  const textarea = state.activeTextarea;
  const currentValue = textarea.value;

  // Find existing label pattern at the beginning of the line
  const labelMatch = currentValue.match(/^(\w+)(\s*\([^)]*\))?:/);
  if (!labelMatch) {
    debug("No label found in textarea");
    updateStatus("First select a label before adding decorations");
    return;
  }

  const label = labelMatch[1];

  // Update text with active decorations
  const newText =
    state.activeDecorations.size > 0
      ? `${label} (${Array.from(state.activeDecorations).join(", ")}):`
      : `${label}:`;

  // Replace just the label and decoration part
  textarea.value = currentValue.replace(/^(\w+)(\s*\([^)]*\))?:/, newText);
  textarea.focus();

  // Trigger input event
  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  debug(`Decoration toggled: ${decoration}, active: ${!isActive}`);
  debug(
    `Current decorations: ${Array.from(state.activeDecorations).join(", ")}`,
  );
}

/**
 * Reset all decoration buttons to inactive state
 */
export function resetDecorationButtons() {
  if (!state.panel) return;

  const buttons = state.panel.querySelectorAll(".cc-decoration-btn");
  buttons.forEach((button) => {
    button.classList.remove("active");
  });
}

/**
 * Update status text
 * @param {string} text The text to display
 */
export function updateStatus(text) {
  const statusText = document.getElementById("cc-status-text");
  if (statusText) statusText.textContent = text;
}

/**
 * Update active textarea status
 */
export function updateActiveTextarea() {
  // Find active textarea (the one that has focus or was last focused)
  const activeElement = document.activeElement;

  if (activeElement && activeElement.tagName === "TEXTAREA") {
    state.activeTextarea = activeElement;
    updateStatus(`Active: ${getTextareaName(activeElement)}`);
    debug("Active textarea:", getTextareaName(activeElement));
  } else {
    // Find textareas in the page that look like GitHub comment fields
    const textareas = Array.from(document.querySelectorAll("textarea")).filter(
      (textarea) =>
        textarea.closest(".js-previewable-comment-form") ||
        textarea.closest("tab-container") ||
        textarea.id === "new_comment_field" ||
        textarea.classList.contains("js-comment-field"),
    );

    if (textareas.length > 0) {
      // Default to the main comment field if available
      const mainComment = textareas.find((ta) => ta.id === "new_comment_field");
      state.activeTextarea = mainComment || textareas[0];
      updateStatus(`Default: ${getTextareaName(state.activeTextarea)}`);
      debug("Default textarea:", getTextareaName(state.activeTextarea));
    } else {
      state.activeTextarea = null;
      updateStatus("No comment fields found");
      debug("No comment fields found");
    }
  }

  // Reset decorations when switching textareas
  state.activeDecorations.clear();
  resetDecorationButtons();
}

/**
 * Get a readable name for a textarea
 * @param {HTMLElement} textarea The textarea element
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

/**
 * Setup listener for textareas getting focus
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
 * Setup keyboard shortcut to toggle panel
 */
export function setupKeyboardShortcut() {
  document.addEventListener("keydown", (e) => {
    // Alt+C shortcut
    if (e.altKey && e.key === "c") {
      togglePanel();
    }
  });
}

// Create extension API if it doesn't exist
if (!window.conventionalCommentsExtensionAPI) {
  window.conventionalCommentsExtensionAPI = {};
}

// Add the API functions
window.conventionalCommentsExtensionAPI = {
  ...window.conventionalCommentsExtensionAPI,
  insertLabel,
  toggleDecoration,
  updateStatus,
  resetDecorationButtons,
};
