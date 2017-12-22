import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';


const index = 'src/js/index.js';
const dependencies = Object.keys(pkg.dependencies);

export default [
  // browser-friendly UMD build
  {
    input: index,
    external: dependencies,
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'wb',
      globals: {
        d3: 'd3',
      },
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      resolve(),
      babel({
        exclude: ['node_modules/**']
      }),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: index,
    external: dependencies,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs(),
      resolve(),
      babel({
        exclude: ['node_modules/**']
      }),
    ],
  }
];
