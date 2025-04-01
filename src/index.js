// Entry point for the Conventional Comments extension
import { debug } from "./utils/debug";
import {
  createFloatingButton,
  initializeButtonDragging,
} from "./components/Button";
import {
  createPanel,
  togglePanel,
  setupTextareaListeners,
  setupKeyboardShortcut,
} from "./components/Panel";
import { initializeTheme, setupSystemThemeListener } from "./utils/theme";
import { loadSavedPosition } from "./utils/storage";
import state from "./state";

// Initialize the extension
function init() {
  debug("Initializing Conventional Comments Extension with theme support");

  // Only run on GitHub pages
  if (!window.location.hostname.includes("github.com")) {
    debug("Not a GitHub page, exiting");
    return;
  }

  try {
    // Initialize theme first
    initializeTheme();

    // Set up system theme change listener
    setupSystemThemeListener();

    // Create floating button with theme indicator
    createFloatingButton();

    // Load saved position
    loadSavedPosition();

    // Create panel (it will be hidden initially)
    createPanel();

    // Initialize button dragging with panel toggle function
    // This must be done after panel is created to avoid circular dependencies
    initializeButtonDragging(togglePanel);

    // Setup listeners
    setupTextareaListeners();
    setupKeyboardShortcut();

    debug("Enhanced initialization complete with theme support");
  } catch (err) {
    console.error("Error initializing Conventional Comments:", err);
  }
}

// Wait for page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
