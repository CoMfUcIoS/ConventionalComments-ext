import { debug } from "./utils/debug";
import { createFloatingButton } from "./components/Button";
import {
  createPanel,
  togglePanel,
  setupTextareaListeners,
  setupKeyboardShortcut,
} from "./components/Panel";
import { initializeTheme, setupSystemThemeListener } from "./utils/theme";
import {
  loadSavedPosition,
  loadCustomLabels,
  loadCustomDecorations,
  saveCustomLabels,
  saveCustomDecorations,
} from "./utils/storage";
import { addThemeSwitcher } from "./components/ThemeSwitcher";
import { initializeCustomLabelsManager } from "./components/CustomLabelsManager";
import { DEFAULT_LABELS, DEFAULT_DECORATIONS } from "./utils/constants";
import state from "./state";

// Make state accessible for debugging
window.conventionalCommentsState = state;

// Initialize the extension
function init() {
  debug("Initializing Conventional Comments Extension with theme support");

  // Only run on GitHub pages
  if (!window.location.hostname.includes("github.com")) {
    debug("Not a GitHub page, exiting");
    return;
  }

  try {
    // First, load saved positions
    loadSavedPosition();
    debug("Loaded saved positions");

    // Initialize custom labels manager - this sets up the API
    initializeCustomLabelsManager();
    debug("Initialized custom labels manager");

    // Initialize theme system
    initializeTheme();
    debug("Initialized theme system");

    // Set up system theme change listener
    setupSystemThemeListener();
    debug("Set up system theme listener");

    // IMPORTANT: Load custom labels and decorations BEFORE creating the panel
    // We use a promise-based approach to ensure everything loads in the correct order
    loadExtensionData()
      .then(() => {
        // Create the floating button
        const floatingButton = createFloatingButton();
        debug("Created floating button");

        // Create the panel with the loaded custom labels/decorations
        const panel = createPanel();
        debug("Created panel with custom labels and decorations");

        // Setup event listeners
        setupTextareaListeners();
        setupKeyboardShortcut();
        debug("Set up event listeners");

        debug(
          "Enhanced initialization complete with theme and custom labels support",
        );
      })
      .catch((err) => {
        console.error("Error loading custom labels/decorations:", err);
        // Create UI elements anyway as a fallback
        const floatingButton = createFloatingButton();
        const panel = createPanel();
        setupTextareaListeners();
        setupKeyboardShortcut();
      });
  } catch (err) {
    console.error("Error initializing Conventional Comments:", err);
  }
}

/**
 * Load all extension data asynchronously
 * @returns {Promise} A promise that resolves when all data is loaded
 */
function loadExtensionData() {
  return new Promise((resolve, reject) => {
    // Use a counter to track when both loads are complete
    let loadCount = 0;
    const totalLoads = 2;

    // Function to check if all loads are complete
    function checkAllLoaded() {
      loadCount++;
      if (loadCount >= totalLoads) {
        resolve();
      }
    }

    // Load custom labels
    loadCustomLabels(function (savedLabels) {
      if (savedLabels) {
        debug(
          `Loaded ${savedLabels.length} custom labels: ${JSON.stringify(savedLabels)}`,
        );
        state.customLabels = savedLabels;
      } else {
        // Initialize with default labels if none saved
        state.customLabels = [...DEFAULT_LABELS];
        saveCustomLabels(state.customLabels);
        debug(
          `No custom labels found, initialized with ${state.customLabels.length} default labels`,
        );
      }
      checkAllLoaded();
    });

    // Load custom decorations
    loadCustomDecorations(function (savedDecorations) {
      if (savedDecorations) {
        debug(
          `Loaded ${savedDecorations.length} custom decorations: ${JSON.stringify(savedDecorations)}`,
        );
        state.customDecorations = savedDecorations;
      } else {
        // Initialize with default decorations if none saved
        state.customDecorations = [...DEFAULT_DECORATIONS];
        saveCustomDecorations(state.customDecorations);
        debug(
          `No custom decorations found, initialized with ${state.customDecorations.length} default decorations`,
        );
      }
      checkAllLoaded();
    });

    // Set a timeout in case something goes wrong with loading
    setTimeout(() => {
      if (loadCount < totalLoads) {
        debug("Timeout waiting for custom labels/decorations to load");
        reject(new Error("Timeout loading custom labels/decorations"));
      }
    }, 5000);
  });
}
/**
 * Update panel buttons when custom labels or decorations change
 */
function updatePanelButtons() {
  const labelsContainer = document.querySelector(
    ".cc-button-container:first-of-type",
  );
  const decorationsContainer = document.querySelector(
    ".cc-button-container:nth-of-type(2)",
  );

  if (labelsContainer && decorationsContainer) {
    debug("Found both containers, updating panel buttons");

    // Update labels container
    if (state.customLabels && state.customLabels.length > 0) {
      // Clear container
      labelsContainer.innerHTML = "";

      // Add labels
      state.customLabels.forEach((label) => {
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

      // Add customize button for labels
      const { addLabelsCustomizeButton } =
        window.conventionalCommentsExtensionAPI || {};
      if (addLabelsCustomizeButton) {
        addLabelsCustomizeButton(labelsContainer);
      }

      debug("Updated labels buttons with:", state.customLabels);
    }

    // Update decorations container
    if (state.customDecorations && state.customDecorations.length > 0) {
      // Clear container
      decorationsContainer.innerHTML = "";

      // Add decorations
      state.customDecorations.forEach((decoration) => {
        const button = document.createElement("button");
        button.textContent = decoration;
        button.dataset.decoration = decoration;
        button.className = "cc-decoration-btn";

        // Add tooltip
        if (DECORATION_INFO[decoration]) {
          button.title = DECORATION_INFO[decoration];
        }

        button.addEventListener("click", () => {
          toggleDecoration(decoration, button);
        });

        decorationsContainer.appendChild(button);
      });

      // Add customize button for decorations
      const { addDecorationsCustomizeButton } =
        window.conventionalCommentsExtensionAPI || {};
      if (addDecorationsCustomizeButton) {
        addDecorationsCustomizeButton(decorationsContainer);
      }

      debug("Updated decorations buttons with:", state.customDecorations);
    }
  } else {
    debug("Could not find containers to update panel buttons");
  }
}

// Wait for page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
