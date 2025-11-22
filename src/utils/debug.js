/**
 * Log debug messages to the console when in debug mode
 * @param  {...any} args Arguments to log
 */
export function debug(...args) {
  // DEBUG is a compile-time constant provided by webpack.DefinePlugin
  // (see webpack.config.js). In production builds it is set to false.
  if (typeof DEBUG !== "undefined" && DEBUG) {
    console.log(
      "%c[Conventional Comments]",
      "color: purple; font-weight: bold",
      ...args,
    );
  }
}

