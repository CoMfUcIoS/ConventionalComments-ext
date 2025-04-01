import { debug } from "./utils/debug";
import { createFloatingButton } from "./components/Button";
import {
  createPanel,
  togglePanel,
  setupTextareaListeners,
  setupKeyboardShortcut,
} from "./components/Panel";
import { initializeTheme, setupSystemThemeListener } from "./utils/theme";
import { loadSavedPosition } from "./utils/storage";
import { addThemeSwitcher } from "./components/ThemeSwitcher";
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
    // First, load saved positions to ensure state is set before UI elements are created
    loadSavedPosition();
    debug("Loaded saved positions");

    // Initialize theme system
    initializeTheme();
    debug("Initialized theme system");

    // Set up system theme change listener
    setupSystemThemeListener();
    debug("Set up system theme listener");

    // Create the floating button first (it doesn't depend on the panel)
    const floatingButton = createFloatingButton();
    debug("Created floating button");

    // Create the panel (it will be hidden initially)
    const panel = createPanel();
    debug("Created panel");

    // Add theme switcher to panel
    addThemeSwitcher();
    debug("Added theme switcher");

    // Setup event listeners
    setupTextareaListeners();
    setupKeyboardShortcut();
    debug("Set up event listeners");

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
