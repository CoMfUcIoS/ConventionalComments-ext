import { debug } from "./debug";
import state from "../state";
import { DEFAULT_LABELS, DEFAULT_DECORATIONS } from "./constants";

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(str) {
  return str.replace(ESCAPE_REGEX, "\\$&");
}

// Pre-normalized lists of default labels/decorations so we can
// tell whether something is "known" or should use the default style.
const NORMALIZED_DEFAULT_LABELS = DEFAULT_LABELS.map((label) =>
  label.toLowerCase(),
);

const NORMALIZED_DEFAULT_DECORATIONS = DEFAULT_DECORATIONS.map((decoration) =>
  decoration.toLowerCase().replace(/\s+/g, "-"),
);

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
    const normalizedLabel = label.toLowerCase();
    const isDefaultLabel =
      NORMALIZED_DEFAULT_LABELS.indexOf(normalizedLabel) !== -1;

    const labelClass = isDefaultLabel
      ? `cc-highlight-${normalizedLabel}`
      : "cc-highlight-default";

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

        const isDefaultDecoration =
          NORMALIZED_DEFAULT_DECORATIONS.indexOf(normalizedDecoration) !== -1;

        const decorationClass = isDefaultDecoration
          ? `cc-highlight-${normalizedDecoration}`
          : "cc-highlight-default";

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
