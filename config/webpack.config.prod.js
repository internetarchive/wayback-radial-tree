var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var webpack = require('webpack');


const targetDirectory = path.resolve(__dirname, '..', 'build');

module.exports = require('./webpack.config.base')({
  entry: {
    'js/radial-tree.min': [path.join(process.cwd(), 'src', 'js', 'index.js')],
    //css is being extracted as plain text
    //by special plugin 'extract-text-webpack-plugin'
  },

  devtool: 'source-map',

  externals: {
    d3: 'd3'
  },

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: targetDirectory,
    library: 'RadialTree',
    libraryExport: 'default',
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader'],
        })
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin(path.join('css', 'radial-tree.min.css')),

    new webpack.LoaderOptionsPlugin({
      // test: /\.css$/, // optionally pass test, include and exclude, default affects all loaders
      minimize: true,
      debug: false,
    }),

    new webpack.optimize.OccurrenceOrderPlugin(),

    new webpack.optimize.UglifyJsPlugin({
      comments: false,
      compress: {
        warnings: false,
      },
      mangle: true,
      sourceMap: true,
    }),
  ],
});
