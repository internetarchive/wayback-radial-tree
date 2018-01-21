# Wayback Radial Tree [![Build Status](https://travis-ci.org/internetarchive/wayback-radial-tree.svg?branch=master)](https://travis-ci.org/internetarchive/wayback-radial-tree)

## Install

```
npm install
```

## Developing

### Testing

Right now we run eslint for style checking and mocha for unit tests.

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
