// Help dialog component
import { debug } from "../utils/debug";
import { switchTheme, getCurrentTheme } from "../utils/theme";
import { THEMES } from "../utils/constants";

/**
 * Show help dialog with guidance on using Conventional Comments
 * @param {Event} e The click event
 */
export function showHelp(e) {
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

  // Title container (to keep title on the left)
  const titleContainer = document.createElement("div");
  titleContainer.classList.add("cc-help-title-container");

  const title = document.createElement("h2");
  title.textContent = "Conventional Comments Guide";
  title.classList.add("cc-help-title");
  titleContainer.appendChild(title);

  // Right side container for theme toggles and close button
  const headerRightContainer = document.createElement("div");
  headerRightContainer.classList.add("cc-header-right-container");

  // Create theme toggles for the header
  const headerThemeToggles = document.createElement("div");
  headerThemeToggles.classList.add("cc-header-theme-toggles");

  THEMES.forEach((theme) => {
    const button = document.createElement("button");
    button.className = "cc-theme-toggle cc-theme-toggle-compact";
    button.dataset.theme = theme.id;
    button.innerHTML = theme.icon;
    button.title = theme.title;
    button.addEventListener("click", () => switchTheme(theme.id));

    headerThemeToggles.appendChild(button);
  });

  // Close button
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.classList.add("cc-close-button");
  closeButton.addEventListener("click", () => {
    helpDialog.style.display = "none";
  });

  // Add theme toggles and close button to right container
  headerRightContainer.appendChild(headerThemeToggles);
  headerRightContainer.appendChild(closeButton);

  // Add both containers to header
  header.appendChild(titleContainer);
  header.appendChild(headerRightContainer);
  helpDialog.appendChild(header);

  // Update theme toggle buttons immediately
  updateHelpDialogThemeButtons(getCurrentTheme());

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
  const guideContent = createGuideTabContent();
  helpDialog.appendChild(guideContent);

  // Examples tab content
  const examplesContent = createExamplesTabContent();
  helpDialog.appendChild(examplesContent);

  // Add dialog to page
  document.body.appendChild(helpDialog);

  // Display the dialog
  helpDialog.style.display = "block";
}

/**
 * Create the guide tab content
 * @returns {HTMLElement} The guide tab content
 */
function createGuideTabContent() {
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
    <li>Drag the floating button or panel header to position them anywhere on the page.</li>
  `;
  guideContent.appendChild(usageList);

  return guideContent;
}

/**
 * Create the examples tab content
 * @returns {HTMLElement} The examples tab content
 */
function createExamplesTabContent() {
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

  return examplesContent;
}

/**
 * Update theme buttons in the help dialog to reflect current theme
 * @param {string} activeTheme The active theme ID
 */
function updateHelpDialogThemeButtons(activeTheme) {
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
