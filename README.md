# Wayback Radial Tree [![Build Status](https://travis-ci.org/internetarchive/wayback-radial-tree.svg?branch=master)](https://travis-ci.org/internetarchive/wayback-radial-tree)

## Install

```
npm install
```

## Developing

### Testing

Right now we run eslint for style checking and are going to use mocha
for unit tests.

```
npm test
```

linting only

```
npm run lint
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
