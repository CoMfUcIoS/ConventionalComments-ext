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

import { debug } from "../utils/debug";
import { switchTheme, getCurrentTheme } from "../utils/theme";
import { THEMES } from "../utils/constants";

/**
 * Add theme switcher to the extension
 */
export function addThemeSwitcher() {
  const content = document.getElementById("conventional-comments-content");
  if (!content) {
    debug("Could not find content element to add theme switcher");
    return;
  }

  // Create theme switcher container
  const themeSwitcher = document.createElement("div");
  themeSwitcher.classList.add("cc-theme-switcher");

  // Create title
  const themeTitle = document.createElement("div");
  themeTitle.textContent = "Theme";
  themeTitle.classList.add("cc-section-title");
  themeSwitcher.appendChild(themeTitle);

  // Create button container
  const themeButtonsContainer = document.createElement("div");
  themeButtonsContainer.classList.add("cc-button-container");

  // Create theme buttons
  THEMES.forEach((theme) => {
    const button = document.createElement("button");
    button.className = "cc-theme-toggle";
    button.dataset.theme = theme.id;
    button.innerHTML = `${theme.icon} ${theme.label}`;
    button.addEventListener("click", () => switchTheme(theme.id));

    themeButtonsContainer.appendChild(button);
  });

  themeSwitcher.appendChild(themeButtonsContainer);
  content.appendChild(themeSwitcher);

  // Update button states
  updateThemeButtons(getCurrentTheme());
}

/**
 * Update theme buttons to reflect current theme
 * @param {string} activeTheme The active theme ID
 */
function updateThemeButtons(activeTheme) {
  debug(`Updating theme buttons to reflect active theme: ${activeTheme}`);
  const buttons = document.querySelectorAll(".cc-theme-toggle");

  buttons.forEach((button) => {
    // First, remove all active classes
    button.classList.remove("active");

    // Then, only add active class to the correct button
    if (button.dataset.theme === activeTheme) {
      button.classList.add("active");
    }
  });
}
