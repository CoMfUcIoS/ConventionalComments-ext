// This creates   a floating panel for GitHub Pull Requests
// Conventional Comments Firefox Extension

(function () {
  // Debug mode for development
  const DEBUG = true;
  function debug(...args) {
    if (DEBUG)
      console.log(
        "%c[Conventional Comments]",
        "color: purple; font-weight: bold",
        ...args,
      );
  }

  // Constants
  const LABELS = [
    "praise",
    "nitpick",
    "suggestion",
    "issue",
    "todo",
    "question",
    "thought",
    "chore",
    "note",
  ];

  const DECORATIONS = [
    "non-blocking",
    "blocking",
    "if-minor",
    "ux",
    "security",
    "test",
  ];

  // State tracking
  const state = {
    panel: null,
    visible: false,
    activeTextarea: null,
    activeDecorations: new Set(),
    position: { right: "20px", bottom: "20px" },
    isExpanded: true,
  };

  function setupSystemThemeListener() {
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

  // Save theme preference to browser storage
  function saveThemePreference(themeId) {
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

  // Load theme preference from browser storage
  function loadThemePreference(callback) {
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

  // Add theme switcher to the extension
  function addThemeSwitcher() {
    if (!state.panel) return;

    const content = document.getElementById("conventional-comments-content");
    if (!content) return;

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
    const themes = [
      { id: "system", label: "System", icon: "🖥️" },
      { id: "light", label: "Light", icon: "☀️" },
      { id: "dark", label: "Dark", icon: "🌙" },
    ];

    themes.forEach((theme) => {
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

  // Get the current theme
  function getCurrentTheme() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      // We'll need to handle this asynchronously in the real implementation
      // This is just a placeholder synchronous version for simplicity
      const savedTheme = localStorage.getItem("cc-theme");
      if (savedTheme) return savedTheme;
    }

    return "system"; // Default to system theme
  }

  // Switch theme
  function switchTheme(themeId) {
    debug(`Switching theme to: ${themeId}`);

    // Save theme preference
    saveThemePreference(themeId);

    // Apply theme
    applyTheme(themeId);

    // Update button states
    updateThemeButtons(themeId);
  }

  // Initialize theme on load
  function initializeTheme() {
    loadThemePreference(function (savedTheme) {
      applyTheme(savedTheme);

      // If panel exists, update button states
      if (state.panel) {
        updateThemeButtons(savedTheme);
      }
    });
  }

  // Apply the selected theme
  function applyTheme(themeId) {
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

  // Update theme buttons to reflect current theme
  function updateThemeButtons(activeTheme) {
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

  // Show help dialog
  function showHelp(e) {
    e.stopPropagation();

    // Create help dialog if it doesn't exist
    let helpDialog = document.getElementById("cc-help-dialog");

    if (helpDialog) {
      helpDialog.style.display = "block";
      return;
    }

    // Create help dialog
    helpDialog = document.createElement("div");
    helpDialog.id = "cc-help-dialog";
    helpDialog.classList.add("cc-help-dialog");

    // Header
    const header = document.createElement("div");
    header.classList.add("cc-help-dialog-header", "panel-header");

    const title = document.createElement("h2");
    title.textContent = "Conventional Comments Guide";
    title.classList.add("cc-help-title");

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.classList.add("cc-close-button");
    closeButton.addEventListener("click", () => {
      helpDialog.style.display = "none";
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    helpDialog.appendChild(header);

    // Add theme switcher to the help dialog
    const helpThemeSwitcher = document.createElement("div");
    helpThemeSwitcher.classList.add("cc-help-theme-switcher");

    const themes = [
      { id: "system", label: "System", icon: "🖥️" },
      { id: "light", label: "Light", icon: "☀️" },
      { id: "dark", label: "Dark", icon: "🌙" },
    ];

    themes.forEach((theme) => {
      const button = document.createElement("button");
      button.className = "cc-theme-toggle";
      button.dataset.theme = theme.id;
      button.innerHTML = `${theme.icon} ${theme.label}`;
      button.addEventListener("click", () => switchTheme(theme.id));

      helpThemeSwitcher.appendChild(button);
    });

    helpDialog.appendChild(helpThemeSwitcher);

    // Update theme toggle buttons
    updateThemeButtons(getCurrentTheme());

    // Create tabs
    const tabsContainer = document.createElement("div");
    tabsContainer.classList.add("cc-tabs-container");

    const tabs = [
      { id: "guide", label: "Guide" },
      { id: "examples", label: "Examples" },
    ];

    tabs.forEach((tab) => {
      const tabButton = document.createElement("button");
      tabButton.dataset.tabId = tab.id;
      tabButton.textContent = tab.label;
      tabButton.classList.add("cc-tab-button");

      if (tab.id === "guide") {
        tabButton.classList.add("cc-tab-active");
      }

      tabButton.addEventListener("click", () => {
        // Update active tab
        tabsContainer.querySelectorAll("button").forEach((btn) => {
          btn.classList.remove("cc-tab-active");
        });
        tabButton.classList.add("cc-tab-active");

        // Show active content
        helpDialog.querySelectorAll("[data-tab-content]").forEach((content) => {
          content.classList.remove("cc-tab-content-active");
        });
        helpDialog
          .querySelector(`[data-tab-content="${tab.id}"]`)
          .classList.add("cc-tab-content-active");
      });

      tabsContainer.appendChild(tabButton);
    });

    helpDialog.appendChild(tabsContainer);

    // Guide tab content
    const guideContent = document.createElement("div");
    guideContent.dataset.tabContent = "guide";
    guideContent.classList.add("cc-tab-content", "cc-tab-content-active");

    // Introduction
    const intro = document.createElement("p");
    intro.innerHTML =
      "Conventional Comments is a standardized format for providing clear, actionable feedback in code reviews and other collaborative processes.";
    guideContent.appendChild(intro);

    // Format section
    const formatTitle = document.createElement("h3");
    formatTitle.textContent = "Format";
    formatTitle.classList.add("cc-section-title");
    guideContent.appendChild(formatTitle);

    const format = document.createElement("div");
    format.classList.add("cc-format-box");
    format.innerHTML =
      "&lt;label&gt; [decorations]: &lt;subject&gt;<br><br>[discussion]";
    guideContent.appendChild(format);

    const formatExplain = document.createElement("ul");
    formatExplain.classList.add("cc-list");
    formatExplain.innerHTML = `
      <li><strong>label</strong> - Signifies what kind of comment is being left.</li>
      <li><strong>decorations</strong> (optional) - Extra labels for the comment in parentheses and comma-separated.</li>
      <li><strong>subject</strong> - The main message of the comment.</li>
      <li><strong>discussion</strong> (optional) - Supporting statements, context, and reasoning.</li>
    `;
    guideContent.appendChild(formatExplain);

    // Labels section
    const labelsTitle = document.createElement("h3");
    labelsTitle.textContent = "Labels";
    labelsTitle.classList.add("cc-section-title");
    guideContent.appendChild(labelsTitle);

    const labelList = document.createElement("div");
    labelList.classList.add("cc-badge-list");

    const labels = [
      {
        name: "praise",
        desc: "Highlights something positive. Try to leave at least one of these comments per review.",
      },
      {
        name: "nitpick",
        desc: "Trivial preference-based requests. These should be non-blocking by nature.",
      },
      {
        name: "suggestion",
        desc: "Proposes improvements to the current subject.",
      },
      {
        name: "issue",
        desc: "Highlights specific problems with the subject under review.",
      },
      { name: "todo", desc: "Small, trivial, but necessary changes." },
      {
        name: "question",
        desc: "Appropriate if you have a potential concern but are not quite sure if it's relevant.",
      },
      {
        name: "thought",
        desc: "An idea that popped up from reviewing. Non-blocking by nature.",
      },
      {
        name: "chore",
        desc: "Simple tasks that must be done before the subject can be accepted.",
      },
      {
        name: "note",
        desc: "Always non-blocking and simply highlights something the reader should take note of.",
      },
    ];

    labels.forEach((label) => {
      const item = document.createElement("div");
      item.classList.add("cc-badge-item");

      const labelBadge = document.createElement("span");
      labelBadge.textContent = label.name;
      labelBadge.classList.add("cc-badge", "cc-label-badge");

      const description = document.createElement("span");
      description.textContent = label.desc;

      item.appendChild(labelBadge);
      item.appendChild(description);
      labelList.appendChild(item);
    });

    guideContent.appendChild(labelList);

    // Decorations section
    const decorationsTitle = document.createElement("h3");
    decorationsTitle.textContent = "Decorations";
    decorationsTitle.classList.add("cc-section-title");
    guideContent.appendChild(decorationsTitle);

    const decorationList = document.createElement("div");
    decorationList.classList.add("cc-badge-list");

    const decorations = [
      {
        name: "non-blocking",
        desc: "Should not prevent the subject from being accepted.",
      },
      {
        name: "blocking",
        desc: "Should prevent the subject from being accepted until resolved.",
      },
      {
        name: "if-minor",
        desc: "Resolve only if the changes end up being minor or trivial.",
      },
      { name: "ux", desc: "Related to user experience concerns." },
      { name: "security", desc: "Related to security concerns." },
      { name: "test", desc: "Related to tests or testing." },
    ];

    decorations.forEach((decoration) => {
      const item = document.createElement("div");
      item.classList.add("cc-badge-item");

      const decoBadge = document.createElement("span");
      decoBadge.textContent = decoration.name;
      decoBadge.classList.add("cc-badge", "cc-decoration-badge");

      const description = document.createElement("span");
      description.textContent = decoration.desc;

      item.appendChild(decoBadge);
      item.appendChild(description);
      decorationList.appendChild(item);
    });

    guideContent.appendChild(decorationList);

    // Best Practices section
    const practicesTitle = document.createElement("h3");
    practicesTitle.textContent = "Best Practices";
    practicesTitle.classList.add("cc-section-title");
    guideContent.appendChild(practicesTitle);

    const practicesList = document.createElement("ul");
    practicesList.classList.add("cc-list");
    practicesList.innerHTML = `
      <li>Use "we" instead of "you" to foster collaboration.</li>
      <li>Use "could" instead of "should" to be less prescriptive.</li>
      <li>Leave specific, actionable feedback.</li>
      <li>Combine similar comments to reduce noise.</li>
      <li>Try to leave at least one positive comment (praise).</li>
    `;
    guideContent.appendChild(practicesList);

    // Learn more section
    const learnMore = document.createElement("p");
    learnMore.innerHTML =
      'Learn more at <a href="https://conventionalcomments.org/" target="_blank">conventionalcomments.org</a>';
    guideContent.appendChild(learnMore);

    // Usage section
    const usageTitle = document.createElement("h3");
    usageTitle.textContent = "How to Use This Extension";
    usageTitle.classList.add("cc-section-title");
    guideContent.appendChild(usageTitle);

    const usageList = document.createElement("ol");
    usageList.classList.add("cc-list");
    usageList.innerHTML = `
      <li>Click on the "CC" floating button to open the panel.</li>
      <li>Click inside the text field you want to comment in.</li>
      <li>Click a label button (like "suggestion" or "issue").</li>
      <li>Add optional decorations (like "non-blocking" or "security").</li>
      <li>Type your comment after the prefix that was added.</li>
      <li>Press Alt+C to quickly show/hide the panel.</li>
    `;
    guideContent.appendChild(usageList);

    // Examples tab content
    const examplesContent = document.createElement("div");
    examplesContent.dataset.tabContent = "examples";
    examplesContent.classList.add("cc-tab-content");

    // Introduction for examples
    const examplesIntro = document.createElement("p");
    examplesIntro.innerHTML =
      "Here are some examples of effective Conventional Comments for different scenarios:";
    examplesContent.appendChild(examplesIntro);

    // Examples
    const examples = [
      {
        title: "Basic Praise",
        label: "praise",
        decoration: "",
        content: "Great job implementing this feature with such clean code!",
        context:
          "I particularly like how you've broken down the complex logic into smaller, testable functions.",
      },
      {
        title: "Simple Suggestion",
        label: "suggestion",
        decoration: "",
        content: "Consider using a more descriptive variable name here.",
        context:
          "'result' is a bit generic. Something like 'userProfileData' would make the code's intent clearer.",
      },
      {
        title: "Issue with Multiple Decorations",
        label: "issue",
        decoration: "blocking, security",
        content:
          "The user input isn't being sanitized before being used in the query.",
        context:
          "This could potentially lead to SQL injection attacks. We should use parameterized queries here.",
      },
      {
        title: "Nitpick with Decoration",
        label: "nitpick",
        decoration: "non-blocking",
        content: "Could we align these declarations for better readability?",
        context:
          "It would make the code more consistent with our style guidelines.",
      },
      {
        title: "Question",
        label: "question",
        decoration: "",
        content:
          "Is there a reason we're not using the existing utility function for this?",
        context:
          "I noticed we already have formatCurrency() in the utils folder that seems to do the same thing.",
      },
      {
        title: "TODO with UX Concerns",
        label: "todo",
        decoration: "ux, non-blocking",
        content: "Add a loading indicator when the form is submitting.",
        context:
          "Users might be confused if there's no feedback during the submission process.",
      },
    ];

    // Create examples
    examples.forEach((example) => {
      const exampleContainer = document.createElement("div");
      exampleContainer.classList.add("cc-example-container");

      const exampleHeader = document.createElement("div");
      exampleHeader.classList.add("cc-example-header");
      exampleHeader.textContent = example.title;
      exampleContainer.appendChild(exampleHeader);

      const exampleContent = document.createElement("div");
      exampleContent.classList.add("cc-example-content");

      // Construct the comment with proper formatting
      let commentPrefix = `<strong>${example.label}`;
      if (example.decoration) {
        commentPrefix += ` (${example.decoration})`;
      }
      commentPrefix += ":</strong> ";

      exampleContent.innerHTML = `
        ${commentPrefix}${example.content}
        ${example.context ? `<br><br>${example.context}` : ""}
      `;

      exampleContainer.appendChild(exampleContent);

      // Code to copy section
      const codeToCopy = document.createElement("div");
      codeToCopy.classList.add("cc-code-block");

      // Plain text version to copy
      let plainTextComment = `${example.label}`;
      if (example.decoration) {
        plainTextComment += ` (${example.decoration})`;
      }
      plainTextComment += `: ${example.content}\n\n${example.context}`;

      // Code snippet styling with monospace
      const codeSnippet = document.createElement("pre");
      codeSnippet.classList.add("cc-code-snippet");
      codeSnippet.textContent = plainTextComment;

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.innerHTML = "Copy";
      copyButton.classList.add("cc-copy-button");

      copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(plainTextComment).then(() => {
          const originalText = copyButton.textContent;
          copyButton.textContent = "Copied!";
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        });
      });

      codeToCopy.appendChild(codeSnippet);
      codeToCopy.appendChild(copyButton);
      exampleContainer.appendChild(codeToCopy);

      examplesContent.appendChild(exampleContainer);
    });

    // Best practices note
    const bestPracticesNote = document.createElement("div");
    bestPracticesNote.classList.add("cc-note-box");
    bestPracticesNote.innerHTML = `
      <strong>Remember:</strong> The goal of Conventional Comments is to improve clarity and actionability. Always:
      <ul class="cc-list">
        <li>Be specific about what needs to change</li>
        <li>Explain why the change matters</li>
        <li>Use a collaborative tone (prefer "we" over "you")</li>
        <li>Provide examples when possible</li>
      </ul>
    `;

    examplesContent.appendChild(bestPracticesNote);

    // Add both tab contents to dialog
    helpDialog.appendChild(guideContent);
    helpDialog.appendChild(examplesContent);

    // Add dialog to page
    document.body.appendChild(helpDialog);

    // Display the dialog
    helpDialog.style.display = "block";
  }

  // Try to load saved position from storage
  function loadSavedPosition() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(
        ["ccPanelPosition", "ccPanelExpanded"],
        function (result) {
          if (result.ccPanelPosition) {
            state.position = result.ccPanelPosition;
            debug("Loaded saved position:", state.position);
          }

          if (result.ccPanelExpanded !== undefined) {
            state.isExpanded = result.ccPanelExpanded;
            debug("Loaded expanded state:", state.isExpanded);
          }

          // Apply saved position/state to panel if it exists
          if (state.panel) {
            applyPanelPosition();
            updateExpandState();
          }
        },
      );
    }
  }

  // Save position to storage
  function savePosition() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ccPanelPosition: state.position });
      debug("Saved position:", state.position);
    }
  }

  // Save expanded state
  function saveExpandState() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ccPanelExpanded: state.isExpanded });
      debug("Saved expanded state:", state.isExpanded);
    }
  }

  // Apply position to panel
  function applyPanelPosition() {
    if (!state.panel) return;

    Object.keys(state.position).forEach((key) => {
      state.panel.style[key] = state.position[key];
    });
  }

  // Create and inject the floating panel
  function createPanel() {
    debug("Creating conventional comments panel");

    // Check if panel already exists
    if (state.panel) {
      debug("Panel already exists, not creating another one");
      return;
    }

    // Create container
    const panel = document.createElement("div");
    panel.id = "conventional-comments-panel";
    panel.classList.add("cc-panel");

    // Create header with move handle
    const header = document.createElement("div");
    header.classList.add("cc-panel-header");

    const title = document.createElement("div");
    title.textContent = "Conventional Comments";
    title.classList.add("cc-panel-title");

    const controls = document.createElement("div");
    controls.classList.add("cc-panel-controls");

    // Create help button
    const helpButton = document.createElement("button");
    helpButton.textContent = "?";
    helpButton.classList.add("cc-control-button");
    helpButton.title = "Help";
    helpButton.addEventListener("click", showHelp);

    // Create toggle button
    const toggleButton = document.createElement("button");
    toggleButton.textContent = state.isExpanded ? "▼" : "▲";
    toggleButton.classList.add("cc-control-button");
    toggleButton.title = state.isExpanded ? "Collapse" : "Expand";
    toggleButton.addEventListener("click", toggleExpand);

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.classList.add("cc-control-button");
    closeButton.title = "Hide Panel";
    closeButton.addEventListener("click", hidePanel);

    controls.appendChild(helpButton);
    controls.appendChild(toggleButton);
    controls.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(controls);
    panel.appendChild(header);

    // Create content container
    const content = document.createElement("div");
    content.id = "conventional-comments-content";
    content.classList.add("cc-content");

    // Add tooltip info for each label
    const LABEL_INFO = {
      praise:
        "Highlights something positive. Try to leave at least one praise per review.",
      nitpick:
        "Trivial preference-based requests. These should be non-blocking by nature.",
      suggestion: "Proposes improvements to the current subject.",
      issue: "Highlights specific problems with the subject under review.",
      todo: "Small, trivial, but necessary changes.",
      question:
        "Appropriate if you have a potential concern but are not quite sure if it's relevant.",
      thought: "An idea that popped up from reviewing. Non-blocking by nature.",
      chore:
        "Simple tasks that must be done before the subject can be accepted.",
      note: "Always non-blocking and simply highlights something the reader should take note of.",
    };

    // Add tooltips for decorations
    const DECORATION_INFO = {
      "non-blocking": "Should not prevent the subject from being accepted.",
      blocking:
        "Should prevent the subject from being accepted until resolved.",
      "if-minor": "Resolve only if the changes end up being minor or trivial.",
      ux: "Related to user experience.",
      security: "Related to security concerns.",
      test: "Related to tests.",
    };

    // Add labels section
    const labelsTitle = document.createElement("div");
    labelsTitle.textContent = "Labels";
    labelsTitle.classList.add("cc-section-title");
    content.appendChild(labelsTitle);

    const labelsContainer = document.createElement("div");
    labelsContainer.classList.add("cc-button-container");

    // Add labels section with button event listeners
    LABELS.forEach((label) => {
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

    content.appendChild(labelsContainer);

    // Add decorations section
    const decorationsTitle = document.createElement("div");
    decorationsTitle.textContent = "Decorations";
    decorationsTitle.classList.add("cc-section-title");
    content.appendChild(decorationsTitle);

    const decorationsContainer = document.createElement("div");
    decorationsContainer.classList.add("cc-button-container");

    DECORATIONS.forEach((decoration) => {
      const button = document.createElement("button");
      button.textContent = decoration;
      button.dataset.decoration = decoration;
      button.className = "cc-decoration-btn";

      // Add tooltip
      if (DECORATION_INFO[decoration]) {
        button.title = DECORATION_INFO[decoration];
      }

      button.addEventListener("click", () =>
        toggleDecoration(decoration, button),
      );

      decorationsContainer.appendChild(button);
    });

    content.appendChild(decorationsContainer);

    // Add footer with status
    const footer = document.createElement("div");
    footer.classList.add("cc-footer");

    const statusText = document.createElement("div");
    statusText.id = "cc-status-text";
    statusText.textContent = "No active text area";

    footer.appendChild(statusText);

    // Put everything together
    panel.appendChild(content);
    panel.appendChild(footer);
    document.body.appendChild(panel);

    // Store panel reference
    state.panel = panel;

    // Apply saved position
    applyPanelPosition();

    // Update expand state
    updateExpandState();

    // Make panel draggable
    makeDraggable(panel, header);

    debug("Conventional comments panel created");

    return panel;
  }

  // Toggle panel visibility
  function togglePanel() {
    if (state.visible) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  // Show the panel
  function showPanel() {
    debug("Showing panel");

    // Create panel if it doesn't exist
    if (!state.panel) {
      createPanel();
    }

    // Update textarea status
    updateActiveTextarea();

    // Show panel
    state.panel.style.display = "block";
    state.visible = true;
  }

  // Hide the panel
  function hidePanel() {
    debug("Hiding panel");

    if (state.panel) {
      state.panel.style.display = "none";
    }

    state.visible = false;
  }

  // Toggle expanded state
  function toggleExpand(e) {
    e.stopPropagation();

    state.isExpanded = !state.isExpanded;
    updateExpandState();
    saveExpandState();
  }

  // Update panel expansion state
  function updateExpandState() {
    if (!state.panel) return;

    const content = document.getElementById("conventional-comments-content");
    const toggleButton = state.panel.querySelector("button:first-of-type");

    if (state.isExpanded) {
      content.style.display = "block";
      toggleButton.textContent = "▼";
      toggleButton.title = "Collapse";
    } else {
      content.style.display = "none";
      toggleButton.textContent = "▲";
      toggleButton.title = "Expand";
    }
  }

  // Make an element draggable
  function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY;
    let startLeft, startTop, startRight, startBottom;

    handle.addEventListener("mousedown", startDrag);

    function startDrag(e) {
      // Only handle left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;

      // Get starting cursor position
      startX = e.clientX;
      startY = e.clientY;

      // Get starting element position
      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;

      // Add event listeners
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
    }

    function onDrag(e) {
      if (!isDragging) return;

      e.preventDefault();

      // Calculate the distance moved
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Update element position based on its original position
      if (state.position.left) {
        const newLeft = Math.max(0, startLeft + dx);
        element.style.left = `${newLeft}px`;
        element.style.right = "auto";
        state.position = { left: `${newLeft}px`, top: element.style.top };
      } else if (state.position.right) {
        const newRight = Math.max(0, startRight - dx);
        element.style.right = `${newRight}px`;
        element.style.left = "auto";
        state.position = { right: `${newRight}px`, top: element.style.top };
      }

      if (state.position.top) {
        const newTop = Math.max(0, startTop + dy);
        element.style.top = `${newTop}px`;
        element.style.bottom = "auto";
        state.position = { ...state.position, top: `${newTop}px` };
      } else if (state.position.bottom) {
        const newBottom = Math.max(0, startBottom - dy);
        element.style.bottom = `${newBottom}px`;
        element.style.top = "auto";
        state.position = { ...state.position, bottom: `${newBottom}px` };
      }
    }

    function stopDrag() {
      if (!isDragging) return;

      isDragging = false;

      // Remove event listeners
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", stopDrag);

      // Save position
      savePosition();
    }
  }

  // Update status based on active textarea
  function updateActiveTextarea() {
    // Find active textarea (the one that has focus or was last focused)
    const activeElement = document.activeElement;

    if (activeElement && activeElement.tagName === "TEXTAREA") {
      state.activeTextarea = activeElement;
      updateStatus(`Active: ${getTextareaName(activeElement)}`);
      debug("Active textarea:", getTextareaName(activeElement));
    } else {
      // Find textareas in the page that look like GitHub comment fields
      const textareas = Array.from(
        document.querySelectorAll("textarea"),
      ).filter(
        (textarea) =>
          textarea.closest(".js-previewable-comment-form") ||
          textarea.closest("tab-container") ||
          textarea.id === "new_comment_field" ||
          textarea.classList.contains("js-comment-field"),
      );

      if (textareas.length > 0) {
        // Default to the main comment field if available
        const mainComment = textareas.find(
          (ta) => ta.id === "new_comment_field",
        );
        state.activeTextarea = mainComment || textareas[0];
        updateStatus(`Default: ${getTextareaName(state.activeTextarea)}`);
        debug("Default textarea:", getTextareaName(state.activeTextarea));
      } else {
        state.activeTextarea = null;
        updateStatus("No comment fields found");
        debug("No comment fields found");
      }
    }

    // Reset decorations when switching textareas
    state.activeDecorations.clear();
    resetDecorationButtons();
  }

  // Get a readable name for a textarea
  function getTextareaName(textarea) {
    if (!textarea) return "None";

    if (textarea.id === "new_comment_field") {
      return "Main Comment";
    } else if (textarea.id) {
      return textarea.id.replace(/_/g, " ").substring(0, 20);
    } else {
      return "Comment Field";
    }
  }

  // Update status text
  function updateStatus(text) {
    const statusText = document.getElementById("cc-status-text");
    if (statusText) statusText.textContent = text;
  }

  // Insert a label into the active textarea
  function insertLabel(label) {
    debug(`Inserting label: ${label}`);

    if (!state.activeTextarea) {
      debug("No active textarea, can't insert label");
      return;
    }

    const textarea = state.activeTextarea;
    const currentValue = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    const newText = `${label}: `;
    textarea.value =
      currentValue.slice(0, selectionStart) +
      newText +
      currentValue.slice(selectionEnd);

    textarea.selectionStart = selectionStart + newText.length;
    textarea.selectionEnd = selectionStart + newText.length;
    textarea.focus();

    // Clear active decorations
    state.activeDecorations.clear();
    resetDecorationButtons();

    // Trigger input event to ensure GitHub registers the change
    const inputEvent = new Event("input", { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    debug(`Label inserted: ${label}`);
  }

  // Toggle a decoration with improved theming
  function toggleDecoration(decoration, button) {
    debug(`Toggling decoration: ${decoration}`);

    if (!state.activeTextarea) {
      debug("No active textarea, can't toggle decoration");
      return;
    }

    // Toggle in active set
    const isActive = state.activeDecorations.has(decoration);

    if (isActive) {
      state.activeDecorations.delete(decoration);
      button.classList.remove("active");
    } else {
      state.activeDecorations.add(decoration);
      button.classList.add("active");
    }

    // Update textarea
    const textarea = state.activeTextarea;
    const currentValue = textarea.value;

    // Find existing label pattern at the beginning of the line
    const labelMatch = currentValue.match(/^(\w+)(\s*\([^)]*\))?:/);
    if (!labelMatch) {
      debug("No label found in textarea");
      updateStatus("First select a label before adding decorations");
      return;
    }

    const label = labelMatch[1];

    // Update text with active decorations
    const newText =
      state.activeDecorations.size > 0
        ? `${label} (${Array.from(state.activeDecorations).join(", ")}):`
        : `${label}:`;

    // Replace just the label and decoration part
    textarea.value = currentValue.replace(/^(\w+)(\s*\([^)]*\))?:/, newText);
    textarea.focus();

    // Trigger input event
    const inputEvent = new Event("input", { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    debug(`Decoration toggled: ${decoration}, active: ${!isActive}`);
    debug(
      `Current decorations: ${Array.from(state.activeDecorations).join(", ")}`,
    );
  }

  // Reset all decoration buttons to inactive state
  function resetDecorationButtons() {
    if (!state.panel) return;

    const buttons = state.panel.querySelectorAll(".cc-decoration-btn");
    buttons.forEach((button) => {
      button.classList.remove("active");
    });
  }

  // Create the toolbar button to open/close the panel with theme indicator
  function createToolbarButton() {
    debug("Creating floating button");

    // Check if button already exists
    if (document.querySelector(".cc-floating-button")) {
      debug("Floating button already exists");
      return;
    }

    // Create floating button
    const button = document.createElement("button");
    button.className =
      "conventional-comments-floating-button cc-floating-button";
    button.innerHTML = "CC";
    button.title = "Conventional Comments";

    // Add a small theme indicator dot
    const themeIndicator = document.createElement("span");
    themeIndicator.className = "cc-theme-indicator";
    updateThemeIndicator(themeIndicator);

    button.appendChild(themeIndicator);
    button.addEventListener("click", togglePanel);

    document.body.appendChild(button);
    debug("Added floating button to body");

    // Set up periodic update of the theme indicator color (in case theme changes)
    setInterval(() => updateThemeIndicator(themeIndicator), 1000);
  }

  // Update the theme indicator color based on current theme
  function updateThemeIndicator(indicator) {
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

  // Listen for textareas getting focus to update active textarea
  function setupTextareaListeners() {
    document.addEventListener("focusin", (e) => {
      if (e.target.tagName === "TEXTAREA") {
        if (state.activeTextarea !== e.target) {
          state.activeTextarea = e.target;
          updateStatus(`Active: ${getTextareaName(e.target)}`);

          // Clear active decorations
          state.activeDecorations.clear();
          resetDecorationButtons();
        }
      }
    });
  }

  // Define keyboard shortcut to toggle panel
  function setupKeyboardShortcut() {
    document.addEventListener("keydown", (e) => {
      // Alt+C shortcut
      if (e.altKey && e.key === "c") {
        togglePanel();
      }
    });
  }

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
      createToolbarButton();

      // Load saved position
      loadSavedPosition();

      // Create panel (it will be hidden initially)
      createPanel();

      // Setup listeners
      setupTextareaListeners();
      setupKeyboardShortcut();

      // Add theme switcher
      addThemeSwitcher();

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
})();
