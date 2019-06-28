const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const swissgrid = require('swissgrid');
const tmp = require('tmp');
const turfClone = require('@turf/clone').default;
const turfMeta = require('@turf/meta');

const swissTileGrid = require('./swiss_tile_grid');
const wgs84 = require('./wgs_84');

tmp.setGracefulCleanup();

async function generateTiles({
  inputGeojson, outputTileDir, minZoom, maxZoom,
}) {
  shelljs.mkdir('-p', outputTileDir);
  const tmpReprojectedGeojson = tmp.fileSync({ dir: outputTileDir, prefix: 'swiss-tiler_', postfix: '.geojson' }).name;
  const tmpTiles = tmp.dirSync({ dir: outputTileDir, prefix: 'swiss-tiler_', unsafeCleanup: true }).name;

  const allLevels = swissTileGrid.resolutions.map((metersPerPixel, targetZoom) => {
    const metersPerTile = swissTileGrid.pixelsPerTile * metersPerPixel;
    const [minX, minY, maxX, maxY] = swissTileGrid.lv95Extent;
    const tileExtent = [[minX, maxX], [minY, maxY]]
      .map(([min, max]) => (max - min) / metersPerTile);

    const maxExtent = Math.max(...tileExtent);

    // Lowest web mercator zoom level that can fit the required number of tiles
    const webMercatorZoom = Math.ceil(Math.log2(Math.ceil(maxExtent)));

    const webMercatorTileSize = wgs84.circumference / (2 ** webMercatorZoom);
    const scale = webMercatorTileSize / metersPerTile;

    return { scale, targetZoom, webMercatorZoom };
  });

  const selectedLevels = allLevels.slice(minZoom, maxZoom + 1);

  console.log('Generate tiles with the following configurations:');
  console.log(selectedLevels);

  const inputData = JSON.parse(fs.readFileSync(inputGeojson));
  turfMeta.coordEach(inputData, (coordinates) => {
    [coordinates[0], coordinates[1]] = swissgrid.project(coordinates);
  });

  for (let i = 0; i < selectedLevels.length; i += 1) {
    const { scale, targetZoom, webMercatorZoom } = selectedLevels[i];
    console.log(`targetZoom ${targetZoom}, reproject data...`);
    const reprojected = turfClone(inputData);
    turfMeta.coordEach(reprojected, (coords) => {
      coords[0] = (coords[0] - swissTileGrid.lv95Extent[0]) * scale - wgs84.circumference / 2;
      coords[1] = (coords[1] - swissTileGrid.lv95Extent[3]) * scale + wgs84.circumference / 2;
    });
    await new Promise(
      resolve => fs.writeFile(tmpReprojectedGeojson, JSON.stringify(reprojected), resolve),
    );

    let simplificationSetting = '--simplification 4';
    if (targetZoom === maxZoom) {
      simplificationSetting = '--no-line-simplification';
    }
    const command = `\
      tippecanoe
        --layer swiss-tiler
        --minimum-zoom ${webMercatorZoom}
        --maximum-zoom ${webMercatorZoom}
        --projection EPSG:3857
        ${simplificationSetting}
        --output-to-directory ${tmpTiles}
        --no-tile-compression
        --force
        ${tmpReprojectedGeojson}`;

    console.log(`targetZoom ${targetZoom}, run tippecanoe...\n\n${command.replace(/\n/g, ' \\\n')}\n`);

    shelljs.exec(command.replace(/\n/g, ''));
    shelljs.mv(
      path.join(tmpTiles, String(webMercatorZoom)),
      path.join(outputTileDir, String(targetZoom)),
    );

    console.log();
  }
}

module.exports = generateTiles;
