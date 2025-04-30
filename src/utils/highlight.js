import { debug } from "./debug";
import state from "../state";
import { DEFAULT_LABELS } from "./constants";

function highlightConventionalComments(elements) {
  const labels = [...DEFAULT_LABELS, ...(state.customLabels || [])];

  const commentRegex = new RegExp(
    `(${labels.join("|")})(\\s*\\(([^)]*)\\))?:\\s*(.*)`,
    "is",
  );

  elements.forEach((comment) => {
    // Normalize the comment text by trimming leading/trailing whitespace
    const trimmedText = comment.textContent.trim();
    const match = commentRegex.exec(trimmedText);
    if (match) {
      debug("Comment Found", comment);

      const label = match[1];
      const decoration = match[3] || "";
      const restOfComment = match[4];
      debug("Label", label);
      debug("Decoration", decoration);
      debug("Rest of comment", restOfComment);

      // Determine CSS classes for label and decoration
      const labelClass =
        `cc-highlight-${label.toLowerCase()}` || "cc-highlight-default";
      const decorationClass = decoration
        ? `cc-highlight-${decoration.toLowerCase()}`
        : "cc-highlight-default";

      const highlightedLabel = `<span class="${labelClass}">${label}</span>`;
      const highlightedDecoration = decoration
        ? ` <span class="${decorationClass}">(${decoration})</span>`
        : "";
      comment.innerHTML = `${highlightedLabel}${highlightedDecoration}: ${restOfComment}`;
    } else {
      comment.innerHTML = comment.textContent;
    }
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
