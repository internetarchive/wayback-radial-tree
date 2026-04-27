
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";
import serve from 'rollup-plugin-serve';
import cssnano from 'cssnano';
import postcss from 'postcss';
import fs from 'fs';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const index = 'src/js/index.js';
const dependencies = Object.keys(pkg.dependencies);

const createBabelConfig = (babelrc, presets) => ({
  babelrc,
  presets,
  exclude: ['node_modules/**']
});

// process & emit CSS (no Sass)
const processCSS = async () => {
  const css = fs.readFileSync('src/css/radialTree.css', 'utf8');
  const result = await postcss([cssnano]).process(css, { from: undefined });
  fs.mkdirSync('build', { recursive: true });
  fs.writeFileSync('build/radial-tree.css', result.css);
};

await processCSS();

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
          d3: 'd3',
        },
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs(),
      resolve(),
      babel(createBabelConfig(false, ['@babel/preset-env'])),
      terser(),
      serve({
        verbose: true,
        contentBase: 'public',
        host: '0.0.0.0',
        port: 5000
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
      babel(createBabelConfig(false, ['@babel/preset-env'])),
    ],
  },
];
