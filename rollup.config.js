import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import scss from 'rollup-plugin-scss'

import pkg from './package.json';


const dependencies = Object.keys(pkg.dependencies);

export default [
  {
    input: 'src/js/index.js',
    external: dependencies,
    output: [
      // browser-friendly UMD build
      {
        file: pkg.browser,
        format: 'umd',
        name: 'wb',
        globals: {
          d3: 'd3',
        },
        sourcemap: true,
      },
      // CommonJS (for Node) and ES module (for bundlers) build.
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
        output: 'build/radial-tree.css',
      })
    ],
  },
];
