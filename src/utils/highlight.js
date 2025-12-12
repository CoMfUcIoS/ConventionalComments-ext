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

/**
 * Check if a text node is inside a code block or pre tag
 * @param {Text} textNode - The text node to check
 * @returns {boolean} - True if inside code/pre tags
 */
function isInCodeBlock(textNode) {
  let parent = textNode.parentElement;
  while (parent) {
    if (parent.tagName === "CODE" || parent.tagName === "PRE") {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Find all text nodes in a container that are NOT in code blocks
 * @param {Element} container - The root element to traverse
 * @returns {Text[]} - Array of text nodes safe to process
 */
function getHighlightableTextNodes(container) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  let node;
  while ((node = walker.nextNode())) {
    if (!isInCodeBlock(node) && node.textContent.trim().length > 0) {
      textNodes.push(node);
    }
  }

  return textNodes;
}

/**
 * Wrap a substring within a text node with a styled span
 * @param {Text} textNode - The text node to modify
 * @param {number} startOffset - Start position of match
 * @param {number} endOffset - End position of match
 * @param {Element} wrapper - The span element to wrap with
 */
function wrapTextInNode(textNode, startOffset, endOffset, wrapper) {
  // Split the text node into three parts: before, match, after
  const beforeText = textNode.textContent.substring(0, startOffset);
  const afterText = textNode.textContent.substring(endOffset);

  // Create text nodes for before and after
  const beforeNode = document.createTextNode(beforeText);
  const afterNode = document.createTextNode(afterText);

  // Use DocumentFragment for atomic DOM operation
  const fragment = document.createDocumentFragment();
  if (beforeText) fragment.appendChild(beforeNode);
  fragment.appendChild(wrapper);
  if (afterText) fragment.appendChild(afterNode);

  // Replace the original text node with the fragment in one operation
  textNode.parentElement.replaceChild(fragment, textNode);
}

/**
 * Create the styled wrapper elements for a matched conventional comment
 * @param {string} label - The label (e.g., "praise", "issue")
 * @param {string} decorationRaw - Raw decoration string
 * @returns {Element} - The wrapper span containing all styled elements
 */
function createHighlightWrapper(label, decorationRaw) {
  const wrapper = document.createElement("span");
  wrapper.className = "cc-highlight-wrapper";

  // Determine CSS class for the label
  const normalizedLabel = label.toLowerCase();
  const isDefaultLabel =
    NORMALIZED_DEFAULT_LABELS.indexOf(normalizedLabel) !== -1;

  const labelClass = isDefaultLabel
    ? `cc-highlight-${normalizedLabel}`
    : "cc-highlight-default";

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
  wrapper.appendChild(labelSpan);

  // Decoration spans (if any)
  const decorations = decorationRaw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  if (decorations.length > 0) {
    wrapper.appendChild(document.createTextNode(" "));

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
        group.appendChild(document.createTextNode(", "));
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
    wrapper.appendChild(group);
  }

  wrapper.appendChild(document.createTextNode(": "));

  return wrapper;
}

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

  // Regex to match: label(decoration): rest
  // Use word boundary to support multi-paragraph comments where the label
  // may not be at the very start of the text node (e.g., after newline or whitespace)
  const commentRegex = new RegExp(
    `(^|\\s)(${escapedLabels.join("|")})(\\s*\\(([^)]*)\\))?:\\s*`,
    "i",
  );

  elements.forEach((comment) => {
    // Skip nodes that are not actual comment bodies (e.g., README previews)
    if (!comment.matches(COMMENT_BODY_SELECTOR)) {
      return;
    }

    // Get all highlightable text nodes (excluding code blocks)
    const textNodes = getHighlightableTextNodes(comment);

    // Find the first text node that contains a conventional comment pattern
    for (const textNode of textNodes) {
      const match = commentRegex.exec(textNode.textContent);

      if (!match) {
        continue;
      }

      debug("Comment Found", comment);

      // match[0] = full match
      // match[1] = leading whitespace or empty string
      // match[2] = label
      // match[3] = decoration group with parens or undefined
      // match[4] = decoration content or undefined
      const leadingWhitespace = match[1] || "";
      const label = match[2];
      const decorationRaw = match[4] || "";

      debug("Label", label);
      debug("Decoration", decorationRaw);

      // Create the wrapper with styled label and decorations
      const wrapper = createHighlightWrapper(label, decorationRaw);

      // Calculate positions for wrapping
      // Start from the label (skip leading whitespace) and go to end of match
      const labelStart = match.index + leadingWhitespace.length;
      const labelEnd = match.index + match[0].length;

      wrapTextInNode(textNode, labelStart, labelEnd, wrapper);

      // Continue to check other text nodes for more conventional comments
      // This allows highlighting in multi-paragraph comments
    }
  });
}

function observeDOMChanges() {
  let rerunTimeout = null;
  function scheduleGlobalHighlight() {
    if (rerunTimeout) return;
    rerunTimeout = setTimeout(() => {
      rerunTimeout = null;
      highlightConventionalComments(
        document.querySelectorAll(COMMENT_BODY_SELECTOR),
      );
    }, 50);
  }

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
      } else if (mutation.type === "characterData") {
        const owner =
          mutation.target.parentElement &&
          mutation.target.parentElement.closest(COMMENT_BODY_SELECTOR);
        if (owner) {
          commentElements.add(owner);
        }
      }
      // Always queue a safety pass to catch PJAX/partial renders (e.g., conversation edits)
      scheduleGlobalHighlight();
    });

    if (commentElements.size > 0) {
      highlightConventionalComments([...commentElements]);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

export function initializeHighlighting() {
  debug("Initializing highlighting feature");
  highlightConventionalComments(
    document.querySelectorAll(COMMENT_BODY_SELECTOR),
  );
  observeDOMChanges();
}

// Export for testing purposes
export { highlightConventionalComments };
