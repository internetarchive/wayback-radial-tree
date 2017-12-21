var CleanWebpackPlugin = require('clean-webpack-plugin');
var DelWebpackPlugin = require('del-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var webpack = require('webpack');


module.exports = require('./webpack.config.base')({
  entry: {
    //we are removing all files which fall out of js or css directory
    //to get more details read description of plugin DelWebpackPlugin

    //css is being extracted as plain text
    //by special plugin 'extract-text-webpack-plugin'
    'js/radial-tree.min': path.join(process.cwd(), 'src', 'js', 'index.js'),
    'del/style': path.join(process.cwd(), 'src', 'sass', 'radialTree.scss'),
  },

  devtool: 'source-map',

  externals: {
    d3: 'd3'
  },

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: path.resolve(__dirname, '..', 'build'),
    library: 'wrt',
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

    new CleanWebpackPlugin([
      'build/*',
    ], {
      root: `${__dirname}/..`,
      allowExternal: true,
      verbose: true,
    }),

    // Delete temporal files
    // webpack create js for each entry even for style files
    // it is well known issue
    // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/518
    new DelWebpackPlugin({
      info: true,
      exclude: [
        'js',
        'css',
      ]
    }),
  ],
});
