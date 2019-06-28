#!/usr/bin/env node

const optimist = require('optimist');

const generateTiles = require('../src');

optimist
  .usage('Usage: $0 INPUT_GEOJSON OUTPUT_TILE_DIR')
  .boolean('help')
  .describe('help', 'Print this help message');
const { argv } = optimist;
if (argv.help || argv._.length < 2) {
  optimist.showHelp();
} else {
  const [inputGeojson, outputTileDir] = argv._;
  const minZoom = 0;
  const maxZoom = 20;
  generateTiles({
    inputGeojson, outputTileDir, minZoom, maxZoom,
  });
}
