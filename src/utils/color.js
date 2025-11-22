/**
 * Choose black or white text for a given background color to ensure contrast.
 * @param {string} color Hex color string (e.g. #RRGGBB)
 * @returns {string} "#000000" or "#FFFFFF"
 */
export function getReadableTextColor(color) {
  const hex = color.replace("#", "");

  if (hex.length !== 6) {
    return "#000000";
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance
  const luminance =
    0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

  return luminance > 0.55 ? "#000000" : "#FFFFFF";
}
