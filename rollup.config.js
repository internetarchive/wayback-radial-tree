import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

const index = 'src/js/index.js';

export default [
  // browser-friendly UMD build
  {
    input: index,
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'wb',
    },
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs() // so Rollup can convert `ms` to an ES module
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: index,
    external: ['ms'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'}
    ]
  }
];
