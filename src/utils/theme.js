/**
 * Copyright (c) 2025 Ioannis Karasavvaidis
 * This file is part of ConventionalComments-ext
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { debug } from "./debug";
import { loadThemePreference, saveThemePreference } from "./storage";

/**
 * Get the current theme
 * @returns {string} The current theme ID
 */
export function getCurrentTheme() {
  try {
    const savedTheme = localStorage.getItem("cc-theme");
    return savedTheme || "system";
  } catch {
    return "system";
  }
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

          // Update theme indicator on floating button if it exists
          const indicator = document.querySelector(".cc-theme-indicator");
          if (indicator) {
            updateThemeIndicator(indicator);
          }
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

    // Update theme indicator on floating button if it exists
    const indicator = document.querySelector(".cc-theme-indicator");
    if (indicator) {
      updateThemeIndicator(indicator);
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

  // Update theme indicator on floating button if it exists
  const indicator = document.querySelector(".cc-theme-indicator");
  if (indicator) {
    updateThemeIndicator(indicator);
  }

  // Update help dialog theme buttons if dialog is open
  const helpDialog = document.getElementById("cc-help-dialog");
  if (helpDialog && helpDialog.style.display === "block") {
    updateHelpDialogThemeButtons(themeId);
  }
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
 * Update help dialog theme buttons to reflect current theme
 * @param {string} activeTheme The active theme ID
 */
export function updateHelpDialogThemeButtons(activeTheme) {
  debug(
    `Updating help dialog theme buttons to reflect active theme: ${activeTheme}`,
  );
  const buttons = document.querySelectorAll(".cc-theme-toggle-compact");

  buttons.forEach((button) => {
    // First, remove all active classes
    button.classList.remove("active");

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
