const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

const isProd = process.env.NODE_ENV === "production";

const publicFolder = path.resolve(__dirname, "..", "pico-engine/public");

const conf = {
  mode: isProd ? "production" : "development",

  entry: {
    "pico-engine-ui": "./src/index.tsx",
  },

  output: {
    path: publicFolder,
    publicPath: "/",
    filename: "[name].js",
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          isProd ? MiniCssExtractPlugin.loader : "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 2, //= > postcss-loader, sass-loader - see https://www.npmjs.com/package/css-loader#importloaders
            },
          },
          {
            loader: "postcss-loader", // Needed for bootstrap.scss
            options: {
              plugins: function () {
                return [require("precss"), require("autoprefixer")];
              },
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /\.(png|jpg|otf|eot|svg|ttf|woff|woff2)(\?.*)?$/i,
        use: [{ loader: "file-loader" }],
      },
    ],
  },

  resolve: {
    extensions: [".ts", ".tsx", ".json", ".js", ".jsx"],
  },

  performance: {
    hints: false,
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id]-[hash].css",
    }),
    isProd ? new OptimizeCssAssetsPlugin({}) : null,

    isProd ? null : new webpack.HotModuleReplacementPlugin(),
  ].filter((c) => !!c),

  devServer: {
    contentBase: publicFolder,
    stats: "minimal",
    hot: true,
    inline: true,
    port: 8080,
    proxy: {
      context: () => true,
      target: "http://localhost:3000"
    }
  },
};

module.exports = conf;
