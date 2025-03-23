import path from 'path';
import webpack from 'webpack';

const isCoverage = process.env.NODE_ENV === 'coverage';

export default (options) => ({
  entry: options.entry,
  devServer: options.devServer,
  devtool: options.devtool,
  externals: options.externals,

  output: Object.assign({
    publicPath: '/',
  }, options.output),

  mode: options.mode,

  module: {
    rules: [].concat(
      isCoverage ? {
        test: /\.js$/,
        // Instrument only testing sources with Istanbul, after ts-loader runs
        include: path.resolve(__dirname, '..', 'src'),
        use: 'istanbul-instrumenter-loader',
      } : [],
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: options.babelOptions,
        },
      },
      // Add additional rules from options.module.rules if they exist
      ...(options.module && options.module.rules ? options.module.rules : []),
    ),
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
    }),
  ].concat(options.plugins || []),

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  target: options.target || (isCoverage ? 'node' : 'web'),
});
