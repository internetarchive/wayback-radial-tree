import baseConfig from './webpack.config.base.js';

export default baseConfig({
  mode: 'development',

  // Emit a source map for easier debugging
  devtool: 'eval-cheap-module-source-map',

  babelOptions: {
    babelrc: false,
    presets: [
      ['@babel/preset-env', {
        modules: false,
      }],
    ],

    // Don't use `external-helpers` module here because for test purpose we need all in place
    plugins: [],
  },
});
