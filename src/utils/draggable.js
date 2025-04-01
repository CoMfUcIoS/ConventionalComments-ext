// Draggable functionality
import { debug } from "./debug";
import state from "../state";
import { savePanelPosition, saveButtonPosition } from "./storage";

/**
 * Make an element draggable by its handle
 * @param {HTMLElement} element The element to make draggable
 * @param {HTMLElement} handle The handle element that will trigger dragging
 * @param {Function} resetPositionFn The function to call when reset position is clicked
 * @param {boolean} isButton Whether this is the floating button (true) or panel (false)
 * @param {Function} togglePanelFn Function to toggle panel visibility (for button double-click)
 */
export function makeDraggable(
  element,
  handle,
  resetPositionFn,
  isButton = false,
  togglePanelFn = null,
) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  const DRAG_THRESHOLD = 3;
  let initialDx = 0,
    initialDy = 0;
  let hasMoved = false;

  // For button only: track last click time for double-click detection
  let lastClickTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 300;

  handle.addEventListener("mousedown", startDrag);

  // Add reset position button
  if (!isButton) {
    // For panel header
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "⟲";
    resetBtn.classList.add("cc-control-button");
    resetBtn.title = "Reset Position";
    resetBtn.style.marginRight = "5px";
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetPositionFn();
    });

    // Add it to the panel controls
    const controls = handle.querySelector(".cc-panel-controls");
    if (controls) {
      controls.insertBefore(resetBtn, controls.firstChild);
    }
  }

  function startDrag(e) {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Don't start drag if clicked on a button
    if (
      e.target.tagName === "BUTTON" ||
      e.target.classList.contains("cc-reset-position")
    )
      return;

    e.preventDefault();

    if (isButton && togglePanelFn) {
      // Check for double click for the floating button
      const clickTime = Date.now();
      if (clickTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
        // It's a double click, toggle the panel
        togglePanelFn();
        lastClickTime = 0;
        return;
      }

      // Store time for double click detection
      lastClickTime = clickTime;
    }

    isDragging = false;
    hasMoved = false;

    // Get starting cursor position
    startX = e.clientX;
    startY = e.clientY;

    // Get starting element position
    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Add event listeners
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
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
        if (isButton) {
          e.stopPropagation(); // Prevent other events when we start dragging for button
        }

        // Store initial position difference to prevent jump
        initialDx = dx;
        initialDy = dy;

        // Add dragging class for visual feedback
        element.classList.add("cc-dragging");
      } else {
        return; // Not dragging yet
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
    const maxLeft = window.innerWidth - element.offsetWidth;
    const maxTop = window.innerHeight - element.offsetHeight;

    const constrainedLeft = Math.min(newLeft, maxLeft);
    const constrainedTop = Math.min(newTop, maxTop);

    // Update element position
    element.style.left = `${constrainedLeft}px`;
    element.style.top = `${constrainedTop}px`;
    element.style.right = "auto";
    element.style.bottom = "auto";

    // Update state
    if (isButton) {
      state.buttonPosition = {
        left: `${constrainedLeft}px`,
        top: `${constrainedTop}px`,
      };
    } else {
      state.position = {
        left: `${constrainedLeft}px`,
        top: `${constrainedTop}px`,
      };
    }
  }

  function stopDrag(e) {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);

    // Remove dragging class
    element.classList.remove("cc-dragging");

    if (isDragging && hasMoved) {
      // If we were dragging, save the position
      if (isButton) {
        saveButtonPosition();
      } else {
        savePanelPosition();
      }

      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    isDragging = false;
  }
}
