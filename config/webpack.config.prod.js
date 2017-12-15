var path = require('path');
var webpack = require('webpack');


const targetDirectory = path.resolve(__dirname, '..', 'build');

module.exports = require('./webpack.config.base')({
  entry: {
    'js/radial-tree.min': [path.join(process.cwd(), 'src/js/index.js')],
  },

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: targetDirectory,
    library: 'RadialTree',
    libraryExport: 'default',
  },

  plugins: [
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
