module.exports = require('./webpack.config.base')({
  mode: 'development',

  // Emit a source map for easier debugging
  devtool: 'source-map-support',

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
});
