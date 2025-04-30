import { debug } from "../utils/debug";
import state from "../state";
import { updateThemeIndicator } from "../utils/theme";
import { applyButtonPosition, resetButtonPosition } from "../utils/storage";
import { togglePanel } from "./Panel";

/**
 * Create and inject the floating button
 * @returns {HTMLElement} The created button
 */
export function createFloatingButton() {
  debug("Creating floating button");

  // Check if button already exists
  let existingButton = document.querySelector(".cc-floating-button");
  if (existingButton) {
    debug("Floating button already exists, removing it for recreation");
    existingButton.remove();
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

  // IMPORTANT: Make the button draggable directly here
  // This solves circular dependency issues
  makeButtonDraggable(button);

  return button;
}

/**
 * Make floating button draggable with double-click to toggle panel
 * @param {HTMLElement} button The button element to make draggable
 */
function makeButtonDraggable(button) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  let lastClickTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 300;
  const DRAG_THRESHOLD = 3;
  let initialDx = 0,
    initialDy = 0;
  let hasMoved = false;

  button.addEventListener("mousedown", startDrag);
  debug("Added mousedown listener to button");

  function startDrag(e) {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Don't start drag if clicked on reset button
    if (e.target.classList.contains("cc-reset-position")) return;

    e.preventDefault();

    // Check for double click
    const clickTime = Date.now();
    if (clickTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
      // It's a double click, toggle the panel
      debug("Double click detected - toggling panel");
      togglePanel();
      lastClickTime = 0;
      return;
    }

    // Store time for double click detection
    lastClickTime = clickTime;

    isDragging = false;
    hasMoved = false;

    // Get starting cursor position
    startX = e.clientX;
    startY = e.clientY;

    // Get starting element position
    const rect = button.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Add event listeners
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    debug("Added drag event listeners to document");
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
        e.stopPropagation();

        // Store initial position difference to prevent jump
        initialDx = dx;
        initialDy = dy;

        // Add dragging class for visual feedback
        button.classList.add("cc-dragging");
        debug("Drag threshold exceeded, starting button drag");
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
    const maxLeft = window.innerWidth - button.offsetWidth;
    const maxTop = window.innerHeight - button.offsetHeight;

    const constrainedLeft = Math.min(newLeft, maxLeft);
    const constrainedTop = Math.min(newTop, maxTop);

    // Update element position
    button.style.left = `${constrainedLeft}px`;
    button.style.top = `${constrainedTop}px`;
    button.style.right = "auto";
    button.style.bottom = "auto";

    // Update state
    state.buttonPosition = {
      left: `${constrainedLeft}px`,
      top: `${constrainedTop}px`,
    };
  }

  function stopDrag(e) {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);

    // Remove dragging class
    button.classList.remove("cc-dragging");

    if (isDragging && hasMoved) {
      // If we were dragging, save the position
      saveButtonPosition();

      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    isDragging = false;
    debug("Button drag stopped");
  }

  // Add reset button functionality
  function saveButtonPosition() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ccButtonPosition: state.buttonPosition });
      debug("Saved button position:", state.buttonPosition);
    }
  }
}
