import { debug } from "../utils/debug";
import state from "../state";
import { saveCustomLabels, saveCustomDecorations } from "../utils/storage";
import { DEFAULT_LABELS, DEFAULT_DECORATIONS } from "../utils/constants";

/**
 * Create and inject a "+" button for the labels section
 * @param {HTMLElement} labelsContainer The container for labels buttons
 */
export function addLabelsCustomizeButton(labelsContainer) {
  debug("Adding labels customize button");

  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.className = "cc-add-custom-btn";
  addButton.title = "Customize Labels";

  addButton.addEventListener("click", () => {
    showCustomizePopup("label");
  });

  labelsContainer.appendChild(addButton);
}

/**
 * Create and inject a "+" button for the decorations section
 * @param {HTMLElement} decorationsContainer The container for decorations buttons
 */
export function addDecorationsCustomizeButton(decorationsContainer) {
  debug("Adding decorations customize button");

  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.className = "cc-add-custom-btn";
  addButton.title = "Customize Decorations";

  addButton.addEventListener("click", () => {
    showCustomizePopup("decoration");
  });

  decorationsContainer.appendChild(addButton);
}

/**
 * Create and show the customization popup
 * With explicit debugging and checks
 * @param {string} type Either "label" or "decoration"
 */
function showCustomizePopup(type) {
  debug(`Showing ${type} customization popup`);

  // Remove existing popup if there is one
  const existingPopup = document.getElementById("cc-customize-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "cc-customize-popup";
  popup.className = "cc-customize-popup";

  // Create popup header
  const header = document.createElement("div");
  header.className = "cc-popup-header";

  const title = document.createElement("h3");
  title.className = "cc-popup-title";
  title.textContent = `Customize ${type === "label" ? "Labels" : "Decorations"}`;

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "cc-popup-close";
  closeButton.addEventListener("click", () => {
    popup.remove();
  });

  header.appendChild(title);
  header.appendChild(closeButton);
  popup.appendChild(header);

  // Create popup content
  const content = document.createElement("div");
  content.className = "cc-popup-content";

  // Add input form for new items
  const formContainer = document.createElement("div");
  formContainer.className = "cc-form-container";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Add a new ${type}...`;
  input.className = "cc-item-input";
  input.id = `cc-new-${type}-input`;

  const addItemButton = document.createElement("button");
  addItemButton.textContent = "Add";
  addItemButton.className = "cc-add-item-btn";

  addItemButton.addEventListener("click", () => {
    const value = input.value.trim().toLowerCase();
    if (value && value.length > 0) {
      debug(`Add button clicked for ${type}: ${value}`);

      // Store current item counts for verification
      const beforeCount =
        type === "label"
          ? state.customLabels
            ? state.customLabels.length
            : 0
          : state.customDecorations
            ? state.customDecorations.length
            : 0;

      // Add the custom item
      addCustomItem(type, value);
      input.value = "";

      // Verify the item was added
      const afterCount =
        type === "label"
          ? state.customLabels
            ? state.customLabels.length
            : 0
          : state.customDecorations
            ? state.customDecorations.length
            : 0;

      debug(`Before add: ${beforeCount} items, after add: ${afterCount} items`);

      // Refresh the items list
      const itemsList = document.getElementById(`cc-${type}s-list`);
      if (itemsList) {
        populateItemsList(type, itemsList);
        debug(`Refreshed ${type}s list in popup`);
      } else {
        debug(`Could not find ${type}s list in popup to refresh`);
      }
    }
  });

  // Allow pressing Enter to add
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = input.value.trim().toLowerCase();
      if (value && value.length > 0) {
        debug(`Enter key pressed for ${type}: ${value}`);

        // Add the custom item
        addCustomItem(type, value);
        input.value = "";

        // Refresh the items list
        const itemsList = document.getElementById(`cc-${type}s-list`);
        if (itemsList) {
          populateItemsList(type, itemsList);
          debug(`Refreshed ${type}s list in popup after Enter key`);
        }
      }
    }
  });

  formContainer.appendChild(input);
  formContainer.appendChild(addItemButton);
  content.appendChild(formContainer);

  // Create list of current items with delete buttons
  const listContainer = document.createElement("div");
  listContainer.className = "cc-items-list-container";

  const listTitle = document.createElement("div");
  listTitle.textContent = `Current ${type === "label" ? "Labels" : "Decorations"}:`;
  listTitle.className = "cc-items-list-title";

  const list = document.createElement("div");
  list.className = "cc-items-list";
  list.id = `cc-${type}s-list`;

  // Populate with current items
  populateItemsList(type, list);

  listContainer.appendChild(listTitle);
  listContainer.appendChild(list);
  content.appendChild(listContainer);

  // Add restore defaults button
  const restoreContainer = document.createElement("div");
  restoreContainer.className = "cc-restore-container";

  const restoreButton = document.createElement("button");
  restoreButton.textContent = "Restore Defaults";
  restoreButton.className = "cc-restore-btn";
  restoreButton.addEventListener("click", () => {
    restoreDefaultItems(type);
  });

  restoreContainer.appendChild(restoreButton);
  content.appendChild(restoreContainer);

  popup.appendChild(content);

  // Add popup to the page
  document.body.appendChild(popup);

  // Position popup near the button that was clicked
  positionPopup(popup, type);

  // Focus the input
  input.focus();

  // Close when clicking outside
  document.addEventListener("mousedown", handleOutsideClick);

  function handleOutsideClick(e) {
    if (
      !popup.contains(e.target) &&
      !e.target.classList.contains("cc-add-custom-btn") &&
      !e.target.classList.contains("cc-restore-defaults-btn")
    ) {
      popup.remove();
      document.removeEventListener("mousedown", handleOutsideClick);
    }
  }

  debug(`${type} customization popup created and displayed`);
}

/**
 * Position the popup near the section it's related to
 * @param {HTMLElement} popup The popup element
 * @param {string} type Either "label" or "decoration"
 */
function positionPopup(popup, type) {
  // Position near the panel
  const panel = document.getElementById("conventional-comments-panel");
  if (!panel) return;

  const rect = panel.getBoundingClientRect();

  // Position to the right of the panel
  popup.style.left = `${rect.right + 10}px`;

  if (type === "label") {
    // Position at the top for labels
    popup.style.top = `${rect.top}px`;
  } else {
    // Position lower for decorations
    popup.style.top = `${rect.top + 150}px`;
  }

  // Ensure popup is within viewport
  setTimeout(() => {
    const popupRect = popup.getBoundingClientRect();

    // Check right edge
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${rect.left - popupRect.width - 10}px`;
    }

    // Check bottom edge
    if (popupRect.bottom > window.innerHeight) {
      popup.style.top = `${window.innerHeight - popupRect.height - 10}px`;
    }

    // Check top edge
    if (popupRect.top < 0) {
      popup.style.top = "10px";
    }
  }, 0);
}

/**
 * Populate the items list with current items
 * @param {string} type Either "label" or "decoration"
 * @param {HTMLElement} list The list element to populate
 */
function populateItemsList(type, list) {
  // Clear the list
  list.innerHTML = "";

  // Get items to display
  const items =
    type === "label" ? state.customLabels || [] : state.customDecorations || [];

  // Add each item
  items.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.className = "cc-item";

    const itemText = document.createElement("span");
    itemText.textContent = item;
    itemText.className = "cc-item-text";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.title = `Remove this ${type}`;
    deleteButton.className = "cc-delete-item-btn";

    deleteButton.addEventListener("click", () => {
      removeCustomItem(type, item);
      itemElement.remove();
    });

    itemElement.appendChild(itemText);
    itemElement.appendChild(deleteButton);
    list.appendChild(itemElement);
  });
}

/**
 * Add a custom item (label or decoration)
 * @param {string} type Either "label" or "decoration"
 * @param {string} item The item to add
 */
export function addCustomItem(type, item) {
  debug(`Adding custom ${type}: ${item}`);

  // Sanitize input
  item = item.trim().toLowerCase();
  if (!item) return;

  // Initialize custom items arrays if they don't exist
  if (!state.customLabels)
    state.customLabels = [...(state.originalLabels || [])];
  if (!state.customDecorations)
    state.customDecorations = [...(state.originalDecorations || [])];

  // Check if item already exists
  const itemExists =
    type === "label"
      ? state.customLabels.includes(item)
      : state.customDecorations.includes(item);

  if (itemExists) {
    debug(`${type} already exists: ${item}`);
    return;
  }

  // Add to state - Make sure we're updating the correct array
  if (type === "label") {
    state.customLabels.push(item);
    saveCustomLabels(state.customLabels);
    debug(
      `Added label "${item}" to customLabels array. Now contains: ${state.customLabels.join(", ")}`,
    );
  } else {
    state.customDecorations.push(item);
    saveCustomDecorations(state.customDecorations);
    debug(
      `Added decoration "${item}" to customDecorations array. Now contains: ${state.customDecorations.join(", ")}`,
    );
  }

  // Update buttons in the main panel - ensure we're updating the correct type
  updateItemButtons(type);
}

/**
 * Remove a custom item (label or decoration)
 * @param {string} type Either "label" or "decoration"
 * @param {string} item The item to remove
 */
export function removeCustomItem(type, item) {
  debug(`Removing ${type}: ${item}`);

  // Initialize custom items arrays if they don't exist
  if (!state.customLabels)
    state.customLabels = [...(state.originalLabels || [])];
  if (!state.customDecorations)
    state.customDecorations = [...(state.originalDecorations || [])];

  // Remove from state - make sure we're updating the correct array
  if (type === "label") {
    state.customLabels = state.customLabels.filter((label) => label !== item);
    saveCustomLabels(state.customLabels);
    debug(
      `Removed label "${item}". customLabels now contains: ${state.customLabels.join(", ")}`,
    );
  } else {
    state.customDecorations = state.customDecorations.filter(
      (decoration) => decoration !== item,
    );
    saveCustomDecorations(state.customDecorations);
    debug(
      `Removed decoration "${item}". customDecorations now contains: ${state.customDecorations.join(", ")}`,
    );
  }

  // Update buttons in the main panel - ensure we're updating the correct type
  updateItemButtons(type);
}

/**
 * Update the label or decoration buttons based on current state
 * Uses explicit IDs to find the correct container
 * @param {string} type Either "label" or "decoration"
 */
function updateItemButtons(type) {
  debug(`Updating ${type} buttons using ID-based selector`);

  // Use the explicit IDs we've added to find the correct container
  const containerId =
    type === "label" ? "cc-labels-container" : "cc-decorations-container";
  let container = document.getElementById(containerId);

  if (!container) {
    debug(`Could not find ${type} buttons container with ID: ${containerId}`);

    // Fallback to title-based approach
    const titleId =
      type === "label" ? "cc-labels-title" : "cc-decorations-title";
    const titleElement = document.getElementById(titleId);

    if (titleElement && titleElement.nextElementSibling) {
      container = titleElement.nextElementSibling;
      debug(`Found ${type} container using title element (fallback)`);
    } else {
      debug(`Could not find ${type} container using fallback approach`);
      return;
    }
  } else {
    debug(`Successfully found ${type} container using ID: ${containerId}`);
  }

  // Remove old buttons
  container.innerHTML = "";

  // Add new buttons with the correct list of items
  const items = type === "label" ? state.customLabels : state.customDecorations;

  // Verify we're using the right list
  debug(
    `Updating ${type} buttons with ${items.length} items: ${items.join(", ")}`,
  );

  items.forEach((item) => {
    const button = document.createElement("button");
    button.textContent = item;
    button.dataset[type] = item;
    button.className = type === "label" ? "cc-label-btn" : "cc-decoration-btn";

    // Add event listener
    if (type === "label") {
      button.addEventListener("click", () => {
        // Use imported insertLabel function
        const insertLabel = window.conventionalCommentsExtensionAPI.insertLabel;
        if (insertLabel) insertLabel(item);
      });
    } else {
      button.addEventListener("click", () => {
        // Use imported toggleDecoration function
        const toggleDecoration =
          window.conventionalCommentsExtensionAPI.toggleDecoration;
        if (toggleDecoration) toggleDecoration(item, button);
      });
    }

    container.appendChild(button);
  });

  // Add the customize button back
  if (type === "label") {
    addLabelsCustomizeButton(container);
    debug("Added labels customize button back");
  } else {
    addDecorationsCustomizeButton(container);
    debug("Added decorations customize button back");
  }

  debug(`Successfully updated ${type} buttons with ${items.length} items`);
}

/**
 * Restore default items
 * @param {string} type Either "label" or "decoration"
 */
function restoreDefaultItems(type) {
  debug(`Restoring default ${type}s`);

  // Show a dialog to choose which items to restore
  const defaultItems = type === "label" ? DEFAULT_LABELS : DEFAULT_DECORATIONS;
  const currentItems =
    type === "label" ? state.customLabels : state.customDecorations;

  // Find items that are not in the current list
  const missingItems = defaultItems.filter(
    (item) => !currentItems.includes(item),
  );

  if (missingItems.length === 0) {
    alert(`All default ${type}s are already in your list.`);
    return;
  }

  createRestoreDialog(type, missingItems);
}

/**
 * Create a dialog to choose which default items to restore
 * @param {string} type Either "label" or "decoration"
 * @param {Array<string>} items The default items not currently in the list
 */
function createRestoreDialog(type, items) {
  // Create dialog container
  const dialog = document.createElement("div");
  dialog.className = "cc-restore-dialog";
  dialog.id = "cc-restore-dialog";

  // Add dialog content
  const dialogContent = document.createElement("div");
  dialogContent.className = "cc-restore-dialog-content";

  // Add title
  const title = document.createElement("h3");
  title.textContent = `Restore Default ${type === "label" ? "Labels" : "Decorations"}`;
  title.className = "cc-restore-dialog-title";
  dialogContent.appendChild(title);

  // Add instructions
  const instructions = document.createElement("p");
  instructions.textContent = `Select the default ${type}s you want to restore:`;
  dialogContent.appendChild(instructions);

  // Add checkboxes for each item
  const checkboxContainer = document.createElement("div");
  checkboxContainer.className = "cc-restore-checkbox-container";

  items.forEach((item) => {
    const itemContainer = document.createElement("div");
    itemContainer.className = "cc-restore-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `cc-restore-${item}`;
    checkbox.value = item;
    checkbox.checked = true; // Check by default

    const label = document.createElement("label");
    label.htmlFor = `cc-restore-${item}`;
    label.textContent = item;

    itemContainer.appendChild(checkbox);
    itemContainer.appendChild(label);
    checkboxContainer.appendChild(itemContainer);
  });

  dialogContent.appendChild(checkboxContainer);

  // Add buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "cc-restore-buttons";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.className = "cc-restore-cancel-btn";
  cancelButton.addEventListener("click", () => {
    dialog.remove();
  });

  const restoreButton = document.createElement("button");
  restoreButton.textContent = "Restore Selected";
  restoreButton.className = "cc-restore-confirm-btn";
  restoreButton.addEventListener("click", () => {
    // Get selected items
    const selectedItems = [];
    const checkboxes = checkboxContainer.querySelectorAll(
      "input[type='checkbox']:checked",
    );
    checkboxes.forEach((checkbox) => {
      selectedItems.push(checkbox.value);
    });

    // Add each selected item
    selectedItems.forEach((item) => {
      addCustomItem(type, item);
    });

    // Refresh the items list in the popup
    const itemsList = document.getElementById(`cc-${type}s-list`);
    if (itemsList) {
      populateItemsList(type, itemsList);
    }

    // Close dialog
    dialog.remove();
  });

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(restoreButton);
  dialogContent.appendChild(buttonContainer);

  // Add content to dialog
  dialog.appendChild(dialogContent);

  // Add dialog to body
  document.body.appendChild(dialog);

  // Position the dialog in the center of the screen
  dialog.style.display = "flex";
  dialog.style.justifyContent = "center";
  dialog.style.alignItems = "center";

  // Add close when clicking outside
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
}

/**
 * Initialize the custom labels manager
 */
export function initializeCustomLabelsManager() {
  debug("Initializing custom labels manager");

  // Store original labels and decorations when extension initializes
  if (!state.originalLabels) {
    state.originalLabels = [...DEFAULT_LABELS];
  }

  if (!state.originalDecorations) {
    state.originalDecorations = [...DEFAULT_DECORATIONS];
  }

  // Create API for other modules to access these functions
  window.conventionalCommentsExtensionAPI = {
    ...window.conventionalCommentsExtensionAPI,
    addCustomItem,
    removeCustomItem,
    addLabelsCustomizeButton,
    addDecorationsCustomizeButton,
  };
}
