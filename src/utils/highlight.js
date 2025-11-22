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

const COMMENT_BODY_SELECTOR = [
  ".comment-body",
  ".js-comment-body",
  ".review-comment-body",
  ".review-comment-contents .comment-body",
  "[class*='ReviewThreadComment-module__SafeHTMLBox']",
  "[class*='ReviewThreadComment-module__BodyHTMLContainer'] .markdown-body",
  "[class*='ReviewThreadComment-module__ReviewThreadContainer'] .markdown-body",
  ".markdown-body[data-testid='comment-body']",
  "[data-testid='comment-body']",
  "[data-testid='review-thread-comment-body']",
  "[data-testid*='comment-body']",
  ".markdown-body.js-comment-body",
  ".js-inline-comments-container .markdown-body",
  ".js-inline-comments-container .comment-body",
].join(",");

function highlightConventionalComments(elements) {
  const labels = [...DEFAULT_LABELS, ...(state.customLabels || [])];

  // Deduplicate labels to keep the regex smaller and avoid redundant matches
  const uniqueLabels = Array.from(new Set(labels));

  // If for some reason we end up with no labels, bail out early
  if (uniqueLabels.length === 0) {
    debug("No labels configured, skipping highlight");
    return;
  }

  const escapedLabels = uniqueLabels.map((label) => escapeRegExp(label));

  const commentRegex = new RegExp(
    `(${escapedLabels.join("|")})(\\s*\\(([^)]*)\\))?:\\s*(.*)`,
    "is",
  );


  elements.forEach((comment) => {
    // Skip nodes that are not actual comment bodies (e.g., README previews)
    if (!comment.matches(COMMENT_BODY_SELECTOR)) {
      return;
    }

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
            if (node.matches(COMMENT_BODY_SELECTOR)) {
              commentElements.add(node);
            } else {
              node.querySelectorAll(COMMENT_BODY_SELECTOR).forEach((child) => {
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
  highlightConventionalComments(
    document.querySelectorAll(COMMENT_BODY_SELECTOR),
  );
  observeDOMChanges();
}
