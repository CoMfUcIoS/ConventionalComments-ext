// Debug utility functions
const DEBUG = true; // This will be replaced with a literal by webpack

/**
 * Log debug messages to the console when in debug mode
 * @param  {...any} args Arguments to log
 */
export function debug(...args) {
  if (DEBUG)
    console.log(
      "%c[Conventional Comments]",
      "color: purple; font-weight: bold",
      ...args,
    );
}
