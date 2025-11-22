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

const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    entry: {
      content: "./src/content.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
              plugins: [
                "@babel/plugin-transform-runtime",
                "@babel/plugin-syntax-dynamic-import",
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
      ],
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
              pure_funcs: isProduction ? ["debug"] : [],
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      // Replace DEBUG with a literal true or false value
      new webpack.DefinePlugin({
        DEBUG: isProduction ? "false" : "true",
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new CopyPlugin({
        patterns: [
          { from: "manifest.json" },
          { from: "icons", to: "icons" },
          { from: "color-variables.css" },
          { from: "styles.css" },
          { from: "help-dialog.css" },
          { from: "custom-labels.css" },
        ],
      }),
      new ZipPlugin({
        filename: "conventional-comments-extension.zip",
      }),
    ].filter(Boolean),
    devtool: isProduction ? false : "source-map",
    resolve: {
      extensions: [".js"],
      alias: {
        "@components": path.resolve(__dirname, "src/components/"),
        "@utils": path.resolve(__dirname, "src/utils/"),
      },
    },
  };
};
