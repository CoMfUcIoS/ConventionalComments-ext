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
  if (document.querySelector(".cc-floating-button")) {
    debug("Floating button already exists");
    return;
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

  // Setup will be completed after Panel is initialized to avoid circular dependencies
  // The actual makeDraggable call will happen from index.js after all components are loaded

  // Set up periodic update of the theme indicator color (in case theme changes)
  setInterval(() => updateThemeIndicator(themeIndicator), 1000);

  return button;
}

/**
 * Initialize button dragging functionality - to be called after panels are initialized
 * @param {Function} togglePanelFn Function to toggle panel visibility
 */
export function initializeButtonDragging(togglePanelFn) {
  if (state.floatingButton) {
    debug("Initializing button dragging with toggle panel function");
    makeDraggable(
      state.floatingButton,
      state.floatingButton,
      resetButtonPosition,
      true,
      togglePanelFn,
    );
  }
}
