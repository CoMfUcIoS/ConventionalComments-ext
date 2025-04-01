// Theme management utilities
import { debug } from "./debug";
import { loadThemePreference, saveThemePreference } from "./storage";

/**
 * Get the current theme
 * @returns {string} The current theme ID
 */
export function getCurrentTheme() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    const savedTheme = localStorage.getItem("cc-theme");
    if (savedTheme) return savedTheme;
  }

  return "system"; // Default to system theme
}

/**
 * Setup listener for system theme changes
 */
export function setupSystemThemeListener() {
  if (window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    // Define the handler function
    const handleThemeChange = (e) => {
      debug(`System theme changed to: ${e.matches ? "dark" : "light"}`);

      // Only update if the current theme is set to "system"
      loadThemePreference(function (savedTheme) {
        if (savedTheme === "system") {
          // No need to update storage, just refresh UI
          applyTheme("system");
          updateThemeButtons("system");
        }
      });
    };

    // Add the listener
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener("change", handleThemeChange);
    } else if (darkModeMediaQuery.addListener) {
      // Fallback for older browsers
      darkModeMediaQuery.addListener(handleThemeChange);
    }

    debug("System theme change listener setup complete");
  }
}

/**
 * Initialize theme on load
 */
export function initializeTheme() {
  loadThemePreference(function (savedTheme) {
    applyTheme(savedTheme);

    // If panel exists, update button states
    if (document.getElementById("conventional-comments-panel")) {
      updateThemeButtons(savedTheme);
    }
  });
}

/**
 * Switch theme
 * @param {string} themeId The theme ID to switch to
 */
export function switchTheme(themeId) {
  debug(`Switching theme to: ${themeId}`);

  // Save theme preference
  saveThemePreference(themeId);

  // Apply theme
  applyTheme(themeId);

  // Update button states
  updateThemeButtons(themeId);
}

/**
 * Apply the selected theme
 * @param {string} themeId The theme ID to apply
 */
export function applyTheme(themeId) {
  // Remove existing theme attributes
  document.documentElement.removeAttribute("data-theme");

  if (themeId === "system") {
    // Let the system preference handle it through CSS
    debug("Using system theme preference");
  } else {
    // Set specific theme
    document.documentElement.setAttribute("data-theme", themeId);
    debug(`Applied ${themeId} theme`);
  }
}

/**
 * Update theme buttons to reflect current theme
 * @param {string} activeTheme The active theme ID
 */
export function updateThemeButtons(activeTheme) {
  debug(`Updating theme buttons to reflect active theme: ${activeTheme}`);
  const buttons = document.querySelectorAll(".cc-theme-toggle");

  buttons.forEach((button) => {
    // First, remove all active classes
    button.classList.remove("active");

    // Reset button styling
    button.style.backgroundColor = "";
    button.style.borderColor = "";
    button.style.color = "";
    button.style.fontWeight = "";

    // Then, only add active class to the correct button
    if (button.dataset.theme === activeTheme) {
      button.classList.add("active");
    }
  });
}

/**
 * Update the theme indicator color based on current theme
 * @param {HTMLElement} indicator The indicator element to update
 */
export function updateThemeIndicator(indicator) {
  if (!indicator) return;

  loadThemePreference(function (theme) {
    // Set the indicator background color based on theme
    if (theme === "system") {
      const isDarkMode =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      indicator.style.backgroundColor = isDarkMode ? "#c9d1d9" : "#24292f";
    } else if (theme === "light") {
      indicator.style.backgroundColor = "#24292f";
    } else if (theme === "dark") {
      indicator.style.backgroundColor = "#c9d1d9";
    }
  });
}
