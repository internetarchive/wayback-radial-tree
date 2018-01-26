# Wayback Radial Tree [![Build Status](https://travis-ci.org/internetarchive/wayback-radial-tree.svg?branch=master)](https://travis-ci.org/internetarchive/wayback-radial-tree)

## Install

```
npm install
```

## Usage

The component has few dependencies which should be loaded
when it is been used a browser (UMD build):

- [lodash](https://lodash.com)
- [d3](https://d3js.org/)

Usually it is enough to add them at the header of html
before <script> of the component:

```html
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js"></script>
<script src="https://unpkg.com/d3@4.12.0/build/d3.js"></script>
```

If you use this component in an application which uses webpack
you don't to worry about dependencies they will be melted
inside of build.

## Developing

### Testing

Right now we run `eslint` for style checking and `mocha` for unit tests.

```
npm test
```

linting only

```
npm run lint
```

unit testing

```
npm run mocha
```

### Local Build

Build library and example on `webpack` and expose example on `8000`
port.

```
npm run example:local
```

if you need custom port. For example for 4567

```
npm run example:local -- --port 4567
```

### Production build

Assemble library for production use.

```
npm run build
```

In result you will get `radial-tree.umd.js` (browser-friendly UMD build),
`radial-tree.cjs.js` (CommonJS (for Node)),
`radial-tree.esm.js` (ES module (for bundlers) build) and
`radial-tree.css` with styles.
