/**
 * Copyright (c) 2025 Ioannis Karasavvaidis
 * This file is part of ConventionalComments-ext
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { debug } from "../utils/debug";
import state from "../state";
import {
  DEFAULT_LABELS,
  DEFAULT_DECORATIONS,
  LABEL_INFO,
  DECORATION_INFO,
  DEFAULT_LABEL_COLORS,
  DEFAULT_DECORATION_COLORS,
} from "../utils/constants";
import {
  saveExpandState,
  updateExpandState,
  applyPanelPosition,
  resetPanelPosition,
  savePanelPosition,
  saveLabelColors,
  saveDecorationColors,
} from "../utils/storage";
import { showHelp } from "./HelpDialog";
import { addThemeSwitcher } from "./ThemeSwitcher";
import { getReadableTextColor } from "../utils/color";

const ACTIVE_TEXTAREA_CLASS = "cc-active-textarea";

/**
 * Check if a textarea is one of GitHub's comment editors.
 * Supports both the classic and the new React-based PR UI.
 * @param {HTMLTextAreaElement | Element | null} textarea
 * @returns {boolean}
 */
function isGithubCommentTextarea(textarea) {
  if (!textarea || textarea.tagName !== "TEXTAREA") return false;

  // Make sure the node is still in the document
  if (!textarea.isConnected) return false;

  // Ignore hidden / non-visible textareas (React sometimes mounts hidden clones)
  const style = window.getComputedStyle(textarea);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const ariaLabel = (textarea.getAttribute("aria-label") || "").toLowerCase();
  const placeholder = (
    textarea.getAttribute("placeholder") || ""
  ).toLowerCase();

  // New React-based comment editors in PRs:
  // they currently use aria-label="Markdown value" and a friendly placeholder.
  if (ariaLabel === "markdown value") {
    return true;
  }
  if (placeholder.includes("add your comment here")) {
    return true;
  }

  // Classic GitHub comment editors (old DOM)
  if (
    textarea.closest(".js-previewable-comment-form") ||
    textarea.closest("tab-container") ||
    textarea.id === "new_comment_field" ||
    textarea.classList.contains("js-comment-field")
  ) {
    return true;
  }

  return false;
}

function getLabelColor(label) {
  const key = (label || "").toLowerCase();
  return (
    (state.customLabelColors && state.customLabelColors[key]) ||
    DEFAULT_LABEL_COLORS[key]
  );
}

function getDecorationColor(decoration) {
  const key = (decoration || "").toLowerCase();
  return (
    (state.customDecorationColors && state.customDecorationColors[key]) ||
    DEFAULT_DECORATION_COLORS[key]
  );
}

function getHighlightTextColor(bgColor) {
  return getReadableTextColor(bgColor);
}

function setActiveTextarea(next) {
  if (state.activeTextarea === next) return;

  if (state.activeTextarea && state.activeTextarea.classList) {
    state.activeTextarea.classList.remove(ACTIVE_TEXTAREA_CLASS);
  }

  state.activeTextarea = next || null;

  if (state.activeTextarea && state.activeTextarea.classList) {
    state.activeTextarea.classList.add(ACTIVE_TEXTAREA_CLASS);
  }
}

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

  const colorButton = document.createElement("button");
  colorButton.textContent = "🎨";
  colorButton.classList.add("cc-control-button");
  colorButton.title = "Highlight colors";

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

  colorButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showColorDialog();
    debug("Color dialog opened");
  });

  controls.appendChild(colorButton);
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
  const labelsToUse = state.customLabels || DEFAULT_LABELS;
  labelsToUse.forEach((label) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.dataset.label = label;
    button.className = "cc-label-btn";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Insert label ${label}`);

    const color = getLabelColor(label);
    if (color) {
      button.style.backgroundColor = color;
      button.style.color = getReadableTextColor(color);
      button.style.borderColor = color;
    }

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

  const decorationsToUse = state.customDecorations || DEFAULT_DECORATIONS;
    decorationsToUse.forEach((decoration) => {
    const button = document.createElement("button");
    button.textContent = decoration;
    button.dataset.decoration = decoration;
    button.className = "cc-decoration-btn";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Toggle decoration ${decoration}`);

    const color = getDecorationColor(decoration);
    if (color) {
      button.style.backgroundColor = color;
      button.style.color = getReadableTextColor(color);
      button.style.borderColor = color;
    }

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

  applyColorsToButtons();

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

  // Prefer the textarea that is visually marked as active
  let textarea =
    document.querySelector(`textarea.${ACTIVE_TEXTAREA_CLASS}`) ||
    state.activeTextarea;

  if (textarea && textarea !== state.activeTextarea) {
    setActiveTextarea(textarea);
  }

  if (!textarea) {
    debug("No active textarea, can't insert label");
    updateStatus("Click in a GitHub comment box first");
    return;
  }

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

  syncPanelWithTextarea(textarea);

  debug(`Label inserted: ${label}`);
}

/**
 * Toggle a decoration
 * @param {string} decoration The decoration to toggle
 * @param {HTMLElement} button The button that was clicked
 */
export function toggleDecoration(decoration, button) {
  debug(`Toggling decoration: ${decoration}`);

  // Prefer the textarea that is visually marked as active
  let textarea =
    document.querySelector(`textarea.${ACTIVE_TEXTAREA_CLASS}`) ||
    state.activeTextarea;

  if (textarea && textarea !== state.activeTextarea) {
    setActiveTextarea(textarea);
  }

  if (!textarea) {
    debug("No active textarea, can't toggle decoration");
    updateStatus("Click in a GitHub comment box first");
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
  const currentValue = textarea.value;

  // Find existing label pattern at the beginning of the line
  const labelMatch = currentValue.match(/^([^\s:(]+)(\s*\([^)]*\))?:/);
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
  textarea.value = currentValue.replace(/^([^\s:(]+)(\s*\([^)]*\))?:/, newText);
  textarea.focus();

  // Trigger input event
  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  syncPanelWithTextarea(textarea);

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
    button.setAttribute("aria-pressed", "false");
  });
}

function resetLabelButtons() {
  if (!state.panel) return;

  const buttons = state.panel.querySelectorAll(".cc-label-btn");
  buttons.forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });
}

function findLabelButton(label) {
  if (!state.panel || !label) return null;
  const target = label.toLowerCase();

  return Array.from(state.panel.querySelectorAll(".cc-label-btn")).find(
    (btn) =>
      (btn.dataset.label || btn.textContent || "").toLowerCase() === target,
  );
}

function findDecorationButton(decoration) {
  if (!state.panel || !decoration) return null;
  const target = decoration.toLowerCase();

  return Array.from(state.panel.querySelectorAll(".cc-decoration-btn")).find(
    (btn) =>
      (btn.dataset.decoration || btn.textContent || "").toLowerCase() ===
      target,
  );
}

/**
 * Sync panel buttons with the content of the active textarea.
 * Detects label + decorations at the start of the textarea and updates button state.
 */
function syncPanelWithTextarea(textarea) {
  // Clear existing button states
  resetLabelButtons();
  state.activeDecorations.clear();
  resetDecorationButtons();

  if (!textarea) return;

  const raw = (textarea.value || textarea.textContent || "").trim();
  const match = /^([^\s:(]+)\s*(\(([^)]*)\))?:/i.exec(raw);

  if (!match) return;

  const label = match[1];
  const decorationsRaw = match[3] || "";

  const labelButton = findLabelButton(label);
  if (labelButton) {
    labelButton.classList.add("active");
    labelButton.setAttribute("aria-pressed", "true");
  }

  const decorations = decorationsRaw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  decorations.forEach((decoration) => {
    const button = findDecorationButton(decoration);
    if (button) {
      state.activeDecorations.add(button.dataset.decoration || decoration);
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    }
  });
}

function applyCustomColorsToHighlights() {
  const labelSpans = document.querySelectorAll("span[data-cc-label]");
  labelSpans.forEach((span) => {
    const color = getLabelColor(span.dataset.ccLabel);
    if (color) {
      span.style.backgroundColor = color;
      span.style.color = getHighlightTextColor(color);
    }
  });

  const decorationSpans = document.querySelectorAll("span[data-cc-decoration]");
  decorationSpans.forEach((span) => {
    const color = getDecorationColor(span.dataset.ccDecoration);
    if (color) {
      span.style.backgroundColor = color;
      span.style.color = getHighlightTextColor(color);
    }
  });
}

function setItemColor(type, name, color) {
  const key = (name || "").toLowerCase();
  if (type === "label") {
    state.customLabelColors[key] = color;
    saveLabelColors(state.customLabelColors);
  } else {
    state.customDecorationColors[key] = color;
    saveDecorationColors(state.customDecorationColors);
  }

  applyColorsToButtons();
  applyCustomColorsToHighlights();
}

function applyColorsToButtons() {
  if (!state.panel) return;

  const labelButtons = state.panel.querySelectorAll(".cc-label-btn");
  labelButtons.forEach((button) => {
    const label = (
      button.dataset.label ||
      button.textContent ||
      ""
    ).toLowerCase();
    const color = getLabelColor(label);
    if (color) {
      button.style.backgroundColor = color;
      button.style.color = getReadableTextColor(color);
      button.style.borderColor = color;
    }
  });

  const decorationButtons = state.panel.querySelectorAll(".cc-decoration-btn");
  decorationButtons.forEach((button) => {
    const decoration = (
      button.dataset.decoration ||
      button.textContent ||
      ""
    ).toLowerCase();
    const color = getDecorationColor(decoration);
    if (color) {
      button.style.backgroundColor = color;
      button.style.color = getReadableTextColor(color);
      button.style.borderColor = color;
    }
  });
}

function buildColorRow(type, name) {
  const row = document.createElement("div");
  row.className = "cc-color-row";

  const label = document.createElement("span");
  label.textContent = name;
  label.className = "cc-color-row-label";

  const input = document.createElement("input");
  input.type = "color";
  input.className = "cc-color-input";

  const key = name.toLowerCase();
  const defaultColor =
    type === "label"
      ? DEFAULT_LABEL_COLORS[key]
      : DEFAULT_DECORATION_COLORS[key];
  const currentColor =
    type === "label"
      ? state.customLabelColors[key] || defaultColor
      : state.customDecorationColors[key] || defaultColor;

  input.value = currentColor || "#ffffff";

  input.addEventListener("input", (e) => {
    const newColor = e.target.value;
    setItemColor(type, name, newColor);
  });

  row.appendChild(label);
  row.appendChild(input);

  return row;
}

function showColorDialog() {
  const existing = document.getElementById("cc-color-dialog");
  if (existing) {
    existing.remove();
  }

  const dialog = document.createElement("div");
  dialog.id = "cc-color-dialog";
  dialog.className = "cc-color-dialog";

  const content = document.createElement("div");
  content.className = "cc-color-dialog-content";

  const title = document.createElement("h3");
  title.textContent = "Highlight Colors";
  content.appendChild(title);

  const description = document.createElement("p");
  description.textContent =
    "Pick custom colors for labels and decorations. Defaults stay in place if you clear a value.";
  content.appendChild(description);

  const labelSection = document.createElement("div");
  labelSection.className = "cc-color-section";
  const labelHeading = document.createElement("h4");
  labelHeading.textContent = "Labels";
  labelSection.appendChild(labelHeading);

  (state.customLabels || DEFAULT_LABELS).forEach((label) => {
    labelSection.appendChild(buildColorRow("label", label));
  });

  const decorationSection = document.createElement("div");
  decorationSection.className = "cc-color-section";
  const decorationHeading = document.createElement("h4");
  decorationHeading.textContent = "Decorations";
  decorationSection.appendChild(decorationHeading);

  (state.customDecorations || DEFAULT_DECORATIONS).forEach((decoration) => {
    decorationSection.appendChild(buildColorRow("decoration", decoration));
  });

  const actions = document.createElement("div");
  actions.className = "cc-color-actions";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.className = "cc-modal-button";
  closeButton.addEventListener("click", () => dialog.remove());

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset to defaults";
  resetButton.className = "cc-modal-button cc-modal-secondary";
  resetButton.addEventListener("click", () => {
    state.customLabelColors = {};
    state.customDecorationColors = {};
    saveLabelColors({});
    saveDecorationColors({});
    updateItemButtons("label");
    updateItemButtons("decoration");
    applyCustomColorsToHighlights();
    showColorDialog();
  });

  actions.appendChild(resetButton);
  actions.appendChild(closeButton);

  content.appendChild(labelSection);
  content.appendChild(decorationSection);
  content.appendChild(actions);

  dialog.appendChild(content);
  document.body.appendChild(dialog);
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

  if (isGithubCommentTextarea(activeElement)) {
    // Currently focused comment textarea
    setActiveTextarea(activeElement);
    updateStatus(`Active: ${getTextareaName(activeElement)}`);
    syncPanelWithTextarea(activeElement);
    debug("Active textarea:", getTextareaName(activeElement));
  } else if (isGithubCommentTextarea(state.activeTextarea)) {
    // No new focus, but we still have a valid textarea from before
    updateStatus(`Active: ${getTextareaName(state.activeTextarea)}`);
    syncPanelWithTextarea(state.activeTextarea);
    debug(
      "Using existing active textarea:",
      getTextareaName(state.activeTextarea),
    );
  } else {
    // Find all visible GitHub comment textareas (classic + React UI)
    const textareas = Array.from(document.querySelectorAll("textarea")).filter(
      (ta) => isGithubCommentTextarea(ta),
    );

    if (textareas.length > 0) {
      // Prefer the main PR comment field if available (classic layout)
      const mainComment = textareas.find((ta) => ta.id === "new_comment_field");

      // Otherwise pick the last one – inline editors are usually rendered last,
      // and this tends to match "the one you just opened".
      const chosen = mainComment || textareas[textareas.length - 1];

      setActiveTextarea(chosen);
      updateStatus(`Default: ${getTextareaName(chosen)}`);
      syncPanelWithTextarea(chosen);
      debug("Default textarea:", getTextareaName(chosen));
    } else {
      setActiveTextarea(null);
      updateStatus("No comment fields found");
      syncPanelWithTextarea(null);
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
  function handlePotentialTextarea(target) {
    const textarea =
      target && target.tagName === "TEXTAREA"
        ? target
        : target.closest && target.closest("textarea");

    if (!isGithubCommentTextarea(textarea)) {
      return;
    }

    if (state.activeTextarea !== textarea) {
      setActiveTextarea(textarea);
      updateStatus(`Active: ${getTextareaName(textarea)}`);

      // Clear active decorations when switching fields
      state.activeDecorations.clear();
      resetDecorationButtons();
    }
  }

  // Capture focus changes coming from keyboard/tabbing or programmatic focus
  document.addEventListener(
    "focusin",
    (e) => {
      handlePotentialTextarea(e.target);
      syncPanelWithTextarea(state.activeTextarea);
    },
    true,
  );

  // Also listen for pointer interactions in case focus events are suppressed
  document.addEventListener(
    "pointerdown",
    (e) => {
      handlePotentialTextarea(e.target);
      syncPanelWithTextarea(state.activeTextarea);
    },
    true,
  );
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
