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
import state from "../state";
import {
  DEFAULT_LABELS,
  DEFAULT_DECORATIONS,
  DEFAULT_LABEL_COLORS,
  DEFAULT_DECORATION_COLORS,
} from "./constants";
import { getReadableTextColor } from "./color";

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

function getLabelColor(label) {
  const key = label.toLowerCase();
  const custom = (state.customLabelColors || {})[key];
  return custom || DEFAULT_LABEL_COLORS[key];
}

function getDecorationColor(decoration) {
  const key = decoration.toLowerCase();
  const custom = (state.customDecorationColors || {})[key];
  return custom || DEFAULT_DECORATION_COLORS[key];
}

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
    labelSpan.dataset.ccLabel = normalizedLabel;

    const labelColor = getLabelColor(label);
    if (labelColor) {
      labelSpan.style.backgroundColor = labelColor;
      labelSpan.style.color = getReadableTextColor(labelColor);
    }
    fragment.appendChild(labelSpan);

    // Decoration spans (if any)
    if (decorations.length > 0) {
      fragment.appendChild(document.createTextNode(" "));

      const group = document.createElement("span");
      group.className = "cc-decoration-group";
      group.appendChild(document.createTextNode("("));

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
          group.appendChild(document.createTextNode(" "));
        }

        const decorationSpan = document.createElement("span");
        decorationSpan.className = `${decorationClass} cc-decoration-chip`;
        decorationSpan.textContent = decoration;
        decorationSpan.dataset.ccDecoration = normalizedDecoration;

        const decorationColor = getDecorationColor(decoration);
        if (decorationColor) {
          decorationSpan.style.backgroundColor = decorationColor;
          decorationSpan.style.color = getReadableTextColor(decorationColor);
        }
        group.appendChild(decorationSpan);
      });

      group.appendChild(document.createTextNode(")"));
      fragment.appendChild(group);
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
