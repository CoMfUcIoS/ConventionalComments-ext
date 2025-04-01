// Floating button component
import { debug } from "../utils/debug";
import state from "../state";
import { makeDraggable } from "../utils/draggable";
import { updateThemeIndicator } from "../utils/theme";
import { applyButtonPosition, resetButtonPosition } from "../utils/storage";

/**
 * Create and inject the floating button
 * @returns {HTMLElement} The created button
 */
export function createFloatingButton() {
  debug("Creating floating button");

  // Check if button already exists
  const existingButton = document.querySelector(".cc-floating-button");
  if (existingButton) {
    debug("Floating button already exists");
    state.floatingButton = existingButton;
    return existingButton;
  }

  // Create floating button
  const button = document.createElement("button");
  button.className = "conventional-comments-floating-button cc-floating-button";
  button.innerHTML = "CC";
  button.title = "Conventional Comments";

  // Add a small theme indicator dot
  const themeIndicator = document.createElement("span");
  themeIndicator.className = "cc-theme-indicator";
  updateThemeIndicator(themeIndicator);

  // Create reset position button
  const resetPositionBtn = document.createElement("span");
  resetPositionBtn.className = "cc-reset-position";
  resetPositionBtn.title = "Reset Position";
  resetPositionBtn.innerHTML = "⟲";
  resetPositionBtn.style.display = "none";

  // Create tooltip for instructions
  const tooltip = document.createElement("span");
  tooltip.className = "cc-floating-tooltip";
  tooltip.textContent = "Drag to move • Double-click to open";

  // Add event listener to reset position button
  resetPositionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetButtonPosition();
  });

  // Show reset button on hover
  button.addEventListener("mouseenter", () => {
    resetPositionBtn.style.display = "block";
  });

  button.addEventListener("mouseleave", () => {
    resetPositionBtn.style.display = "none";
  });

  button.appendChild(themeIndicator);
  button.appendChild(resetPositionBtn);
  button.appendChild(tooltip);

  document.body.appendChild(button);
  debug("Added floating button to body");

  // Store button reference
  state.floatingButton = button;

  // Apply saved position
  applyButtonPosition();

  // Set up periodic update of the theme indicator color (in case theme changes)
  setInterval(() => updateThemeIndicator(themeIndicator), 1000);

  return button;
}

/**
 * Initialize button dragging functionality - to be called after panels are initialized
 * @param {Function} togglePanelFn Function to toggle panel visibility
 */
export function initializeButtonDragging(togglePanelFn) {
  if (!state.floatingButton) {
    debug("Cannot initialize button dragging: button not found");
    return;
  }

  debug("Initializing button dragging with toggle panel function");

  // Ensure we're working with the actual DOM element
  const button =
    state.floatingButton instanceof Element
      ? state.floatingButton
      : document.querySelector(".cc-floating-button");

  if (!button) {
    debug("Button element not found in DOM");
    return;
  }

  // Clear any existing event listeners (important for reinitialization)
  const newButton = button.cloneNode(true);
  if (button.parentNode) {
    button.parentNode.replaceChild(newButton, button);
    state.floatingButton = newButton;
  }

  // Now make the button draggable with toggle functionality
  makeDraggable(newButton, newButton, resetButtonPosition, true, togglePanelFn);

  // Also add direct double-click handler as a fallback
  newButton.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    debug("Double-click detected on floating button");
    if (typeof togglePanelFn === "function") {
      togglePanelFn();
    }
  });

  debug("Button dragging and double-click handler initialized");
}
