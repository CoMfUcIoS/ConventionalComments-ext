// Update your src/utils/constants.js file to include DEFAULT_LABELS and DEFAULT_DECORATIONS

// Default conventional comment labels
export const DEFAULT_LABELS = [
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

// Default conventional comment decorations
export const DEFAULT_DECORATIONS = [
  "non-blocking",
  "blocking",
  "if-minor",
  "ux",
  "security",
  "test",
];

// Use these arrays for the LABELS and DECORATIONS exports
export const LABELS = DEFAULT_LABELS;

export const DECORATIONS = DEFAULT_DECORATIONS;

// Label descriptions for tooltips
export const LABEL_INFO = {
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
  chore: "Simple tasks that must be done before the subject can be accepted.",
  note: "Always non-blocking and simply highlights something the reader should take note of.",
};

// Decoration descriptions for tooltips
export const DECORATION_INFO = {
  "non-blocking": "Should not prevent the subject from being accepted.",
  blocking: "Should prevent the subject from being accepted until resolved.",
  "if-minor": "Resolve only if the changes end up being minor or trivial.",
  ux: "Related to user experience.",
  security: "Related to security concerns.",
  test: "Related to tests.",
};

// Theme definitions
export const THEMES = [
  { id: "system", label: "System", icon: "🖥️", title: "System Theme" },
  { id: "light", label: "Light", icon: "☀️", title: "Light Theme" },
  { id: "dark", label: "Dark", icon: "🌙", title: "Dark Theme" },
];
