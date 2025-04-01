import { debug } from "./debug";
import state from "../state";

/**
 * Save theme preference to browser storage
 * @param {string} themeId The theme ID to save
 */
export function saveThemePreference(themeId) {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ ccTheme: themeId }, function () {
      debug(`Theme preference saved: ${themeId}`);
    });
  } else {
    // Fallback to localStorage for debugging or if storage API unavailable
    localStorage.setItem("cc-theme", themeId);
    debug(`Theme preference saved to localStorage: ${themeId}`);
  }
}

/**
 * Load theme preference from browser storage
 * @param {Function} callback Function to call with the loaded theme
 */
export function loadThemePreference(callback) {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get("ccTheme", function (result) {
      const savedTheme = result.ccTheme || "system";
      debug(`Loaded theme preference: ${savedTheme}`);
      callback(savedTheme);
    });
  } else {
    // Fallback to localStorage
    const savedTheme = localStorage.getItem("cc-theme") || "system";
    debug(`Loaded theme preference from localStorage: ${savedTheme}`);
    callback(savedTheme);
  }
}

/**
 * Try to load saved positions from storage
 */
export function loadSavedPosition() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(
      ["ccPanelPosition", "ccPanelExpanded", "ccButtonPosition"],
      function (result) {
        if (result.ccPanelPosition) {
          state.position = result.ccPanelPosition;
          debug("Loaded saved panel position:", state.position);
        } else {
          // Default position if none saved
          state.position = { right: "20px", bottom: "20px" };
          debug("Using default panel position");
        }

        if (result.ccButtonPosition) {
          state.buttonPosition = result.ccButtonPosition;
          debug("Loaded saved button position:", state.buttonPosition);
        } else {
          // Default button position if none saved
          state.buttonPosition = { right: "20px", bottom: "80px" };
          debug("Using default button position");
        }

        if (result.ccPanelExpanded !== undefined) {
          state.isExpanded = result.ccPanelExpanded;
          debug("Loaded expanded state:", state.isExpanded);
        } else {
          state.isExpanded = true;
          debug("Using default expanded state: true");
        }
      },
    );
  } else {
    // Set defaults if no storage API
    state.position = { right: "20px", bottom: "20px" };
    state.buttonPosition = { right: "20px", bottom: "80px" };
    state.isExpanded = true;
    debug("No storage API available, using defaults");
  }
}

/**
 * Save panel position to storage
 */
export function savePanelPosition() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ ccPanelPosition: state.position });
    debug("Saved panel position:", state.position);
  } else {
    // Fallback to localStorage
    localStorage.setItem("cc-panel-position", JSON.stringify(state.position));
    debug("Saved panel position to localStorage:", state.position);
  }
}

/**
 * Save button position to storage
 */
export function saveButtonPosition() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ ccButtonPosition: state.buttonPosition });
    debug("Saved button position:", state.buttonPosition);
  } else {
    // Fallback to localStorage
    localStorage.setItem(
      "cc-button-position",
      JSON.stringify(state.buttonPosition),
    );
    debug("Saved button position to localStorage:", state.buttonPosition);
  }
}

/**
 * Save expanded state to storage
 */
export function saveExpandState() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ ccPanelExpanded: state.isExpanded });
    debug("Saved expanded state:", state.isExpanded);
  } else {
    // Fallback to localStorage
    localStorage.setItem("cc-panel-expanded", state.isExpanded.toString());
    debug("Saved expanded state to localStorage:", state.isExpanded);
  }
}

/**
 * Apply saved position to panel
 */
export function applyPanelPosition() {
  if (!state.panel) return;

  Object.keys(state.position).forEach((key) => {
    state.panel.style[key] = state.position[key];
  });

  debug("Applied panel position:", state.position);
}

/**
 * Apply saved position to button
 */
export function applyButtonPosition() {
  if (!state.floatingButton) return;

  // Clear all position properties first
  state.floatingButton.style.top = "auto";
  state.floatingButton.style.right = "auto";
  state.floatingButton.style.bottom = "auto";
  state.floatingButton.style.left = "auto";

  // Then apply the saved position properties
  Object.keys(state.buttonPosition).forEach((key) => {
    state.floatingButton.style[key] = state.buttonPosition[key];
  });

  debug("Applied button position:", state.buttonPosition);
}

/**
 * Reset the button position to default
 */
export function resetButtonPosition() {
  state.buttonPosition = { right: "20px", bottom: "80px" };
  applyButtonPosition();
  saveButtonPosition();
  debug("Reset button position to default");
}

/**
 * Reset the panel position to default
 */
export function resetPanelPosition() {
  state.position = { right: "20px", bottom: "20px" };
  applyPanelPosition();
  savePanelPosition();
  debug("Reset panel position to default");
}

/**
 * Update panel expansion state
 */
export function updateExpandState() {
  if (!state.panel) return;

  const content = document.getElementById("conventional-comments-content");
  if (!content) {
    debug("Could not find content element to update expand state");
    return;
  }

  const toggleButton = state.panel.querySelector(
    ".cc-control-button[title^='Collapse'], .cc-control-button[title^='Expand']",
  );

  if (!toggleButton) {
    debug("Could not find toggle button to update expand state");
    return;
  }

  if (state.isExpanded) {
    content.style.display = "block";
    toggleButton.textContent = "▼";
    toggleButton.title = "Collapse";
    debug("Panel expanded");
  } else {
    content.style.display = "none";
    toggleButton.textContent = "▲";
    toggleButton.title = "Expand";
    debug("Panel collapsed");
  }
}
