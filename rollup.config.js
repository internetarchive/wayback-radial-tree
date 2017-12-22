import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

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
      commonjs(),
      resolve(),
      babel({
        exclude: ['node_modules/**']
      }),
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: index,
    external: ['ms'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'}
    ],
    plugins: [
      resolve(),
      babel({
        exclude: ['node_modules/**']
      }),
    ]
  }
];
