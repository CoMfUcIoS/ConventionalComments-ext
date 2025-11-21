import { debug } from "./debug";
import state from "../state";
import { DEFAULT_LABELS } from "./constants";

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(str) {
  return str.replace(ESCAPE_REGEX, "\\$&");
}

function highlightConventionalComments(elements) {
  const labels = [...DEFAULT_LABELS, ...(state.customLabels || [])];
  const escapedLabels = labels.map((label) => escapeRegExp(label));

  const commentRegex = new RegExp(
    `(${escapedLabels.join("|")})(\\s*\\(([^)]*)\\))?:\\s*(.*)`,
    "is",
  );

  elements.forEach((comment) => {
    // Normalize the comment text by trimming leading/trailing whitespace
    const trimmedText = comment.textContent.trim();
    const match = commentRegex.exec(trimmedText);

    if (!match) {
      return;
    }

    debug("Comment Found", comment);

    const label = match[1];
    const decorationRaw = match[3] || "";
    const restOfComment = match[4] || "";

    debug("Label", label);
    debug("Decoration", decorationRaw);
    debug("Rest of comment", restOfComment);

    // Determine CSS class for the label
    const labelClass =
      `cc-highlight-${label.toLowerCase()}` || "cc-highlight-default";

    // Split decorations on commas and normalize them
    const decorations = decorationRaw
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const fragment = document.createDocumentFragment();

    // Label span
    const labelSpan = document.createElement("span");
    labelSpan.className = labelClass;
    labelSpan.textContent = label;
    fragment.appendChild(labelSpan);

    // Decoration spans (if any)
    if (decorations.length > 0) {
      fragment.appendChild(document.createTextNode(" "));

      decorations.forEach((decoration, index) => {
        const normalizedDecoration = decoration
          .toLowerCase()
          .replace(/\s+/g, "-");

        const decorationClass =
          `cc-highlight-${normalizedDecoration}` || "cc-highlight-default";

        if (index > 0) {
          fragment.appendChild(document.createTextNode(" "));
        }

        const decorationSpan = document.createElement("span");
        decorationSpan.className = decorationClass;
        decorationSpan.textContent = `(${decoration})`;
        fragment.appendChild(decorationSpan);
      });
    }

    fragment.appendChild(document.createTextNode(": "));
    fragment.appendChild(document.createTextNode(restOfComment));

    // Replace existing content with the highlighted content
    while (comment.firstChild) {
      comment.removeChild(comment.firstChild);
    }
    comment.appendChild(fragment);
  });
}

function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    const commentElements = new Set();

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches(".comment-body")) {
              commentElements.add(node);
            } else {
              node.querySelectorAll(".comment-body").forEach((child) => {
                commentElements.add(child);
              });
            }
          }
        });
      }
    });

    if (commentElements.size > 0) {
      highlightConventionalComments([...commentElements]);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function initializeHighlighting() {
  debug("Initializing highlighting feature");
  highlightConventionalComments(document.querySelectorAll(".comment-body"));
  observeDOMChanges();
}
