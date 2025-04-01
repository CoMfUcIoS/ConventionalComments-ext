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
      content: "./content.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    module: {
      rules: [
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
        ],
      }),
      isProduction
        ? new ZipPlugin({
            filename: "conventional-comments-extension.zip",
          })
        : null,
    ].filter(Boolean),
    devtool: isProduction ? false : "source-map",
  };
};
