var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');


module.exports = require('./webpack.config.base')({
  mode: 'development',

  // Add hot reloading in development
  entry: {
    'js/radial-tree': path.join(process.cwd(), 'src', 'js', 'index.js'),
  },

  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    library: 'wb',
    libraryTarget: "umd",
  },

  babelOptions: {
    babelrc: false,
    "presets": [
      ["env", {
        "modules": false
      }]
    ],

    //don't use `external-helpers` module here because for test purpose we need all in place
    "plugins": [],
  },

  devServer: {
    clientLogLevel: "info",
    //(!) shouldn't use this option in production
    //https://github.com/webpack/webpack-dev-server/releases/tag/v2.4.3
    disableHostCheck: true,
    historyApiFallback: {
      disableDotRule: true,
      verbose: true,
    },
    host: '0.0.0.0',
    hot: true,
    port: 8000,
  },

  // Emit a source map for easier debugging
  devtool: 'cheap-module-eval-source-map',

  externals: {
    d3: 'd3'
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      template: 'examples/iskme-radial-tree-local.html',
    }),
    new webpack.LoaderOptionsPlugin({
      // test: /\.css$/, // optionally pass test, include and exclude, default affects all loaders
      minimize: true,
      debug: false,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   comments: false,
    //   compress: {
    //     warnings: false,
    //   },
    //   mangle: true,
    //   sourceMap: true,
    // }),
  ],

  target: 'web',
});
