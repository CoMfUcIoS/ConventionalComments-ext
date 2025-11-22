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
