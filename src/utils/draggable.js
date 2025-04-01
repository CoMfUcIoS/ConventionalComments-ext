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
  if (!element || !handle) {
    debug("Cannot make draggable: element or handle is null");
    return;
  }

  // This function is kept for compatibility but is no longer used directly
  // The panel and button components are now implementing their own draggable functionality

  debug(
    `makeDraggable called for ${isButton ? "button" : "panel"} but not applying - using direct implementation instead`,
  );
}
