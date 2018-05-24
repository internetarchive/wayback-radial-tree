import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import scss from 'rollup-plugin-scss'
import { terser } from "rollup-plugin-terser";

import cssnano from 'cssnano';
import postcss from 'postcss';


import pkg from './package.json';


const index = 'src/js/index.js';
const dependencies = Object.keys(pkg.dependencies);

export default [
  // browser-friendly UMD build
  {
    input: index,
    external: dependencies,
    output: [
      {
        file: pkg.browser,
        format: 'umd',
        name: 'wb',
        globals: {
          _: '_',
          d3: 'd3',
        },
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs(),
      resolve(),
      babel({
        exclude: ['node_modules/**']
      }),
      terser(),
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
  },

  //styles
  {
    input: 'src/sass/radialTree.scss',
    output: {
      format: 'es',
    },
    plugins: [
      scss({
        processor: css => postcss([cssnano])
          .process(css)
          .then(result => result.css),
        output: 'build/radial-tree.css',
      })
    ],
  },
];
