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
