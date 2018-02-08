var path = require('path');
var webpack = require('webpack');


const isCoverage = process.env.NODE_ENV === 'coverage';

module.exports = (options) => ({
  entry: options.entry,
  devServer: options.devServer,
  devtool: options.devtool,

  externals: options.externals,

  output: Object.assign({
    publicPath: '/',
  }, options.output),

  module: {
    loaders: [].concat(
      isCoverage ? {
        test: /\.js$/,
        // instrument only testing sources with Istanbul, after ts-loader runs
        include: path.resolve(__dirname, '..', 'src'),
        loader: 'istanbul-instrumenter-loader'
      } : [], {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
      }, {
        test: /\.scss/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
      }, {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: options.babelOptions,
      }
    ),
    rules: options.module && options.module.rules,
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"' + (process.env.NODE_ENV || 'develop') + '"',
      },
    }),
  ].concat(options.plugins || []),

  resolve: {
    extensions: ['.js', '.react.js'],
  },

  target: options.target || (isCoverage ? 'node' : 'web'),
});
