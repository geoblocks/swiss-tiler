'use strict';

const projection = lv95();
const tileGrid = swissTileGrid();

const map = initializeMap(projection, tileGrid);

const backgroundMap = swisstopoLayer(projection, tileGrid, 'ch.swisstopo.pixelkarte-farbe');
map.addLayer(backgroundMap);

const overlay = vectorTileLayer(projection, tileGrid);
map.addLayer(overlay);

function lv95() {
  const { project, unproject } = swissgrid;

  const projection = new ol.proj.Projection({
    code: 'EPSG:2056',
    units: 'm',
  });

  ol.proj.addProjection(projection);
  ol.proj.addCoordinateTransforms('EPSG:4326', projection.getCode(), project, unproject);

  return projection;
}

function swissTileGrid() {
  return new ol.tilegrid.TileGrid({
    extent: [2420000, 1030000, 2900000, 1350000],
    resolutions: [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5],
  });
}

function initializeMap(projection, tileGrid) {
  const extent = tileGrid.getExtent();
  const view = new ol.View({
    extent,
    projection,
    resolutions: tileGrid.getResolutions(),
  });
  const map = new ol.Map({
    controls: ol.control.defaults({ attribution: false }).extend([
      new ol.control.Attribution({
        collapsible: false,
      }),
    ]),
    target: document.body,
    view,
  });
  const padding = -50000;
  view.fit([
    extent[0] - padding, extent[1] - padding,
    extent[2] + padding, extent[3] + padding,
  ]);
  return map;
}

function swisstopoLayer(projection, tileGrid, layer) {
  return new ol.layer.Tile({
    extent: tileGrid.getExtent(),
    source: new ol.source.XYZ(({
      attributions: '<a href="https://www.swisstopo.admin.ch/en/home.html" target="_blank">swisstopo</a>',
      url: `https://wmts{0-9}.geo.admin.ch/1.0.0/${layer}/default/current/2056/{z}/{x}/{y}.jpeg`,
      tileGrid,
      projection,
    })),
  });
}

function vectorTileLayer(projection, tileGrid) {
  // The swisstopo tile grid has a resolution of 10 meters per pixel at level 20, with a tile size of 256x256 px.
  // This results in a precision of 0.625 m for vector tiles with the default 4096x4096 extent.
  // (10 * 256 / 4096 = 0.625)
  const maxZoom = 20;

  const source = new ol.source.VectorTile({
    format: new ol.format.MVT(),
    tileGrid: new ol.tilegrid.TileGrid({
      extent: tileGrid.getExtent(),
      resolutions: tileGrid.getResolutions().slice(0, maxZoom + 1),
    }),
    url: 'tiles/{z}/{x}/{y}.pbf',
  });

  // Work around OpenLayers issue where a new tile grid is generated
  // See https://github.com/openlayers/openlayers/blob/51c8886d60a9f239d6b6372707641a93c9aa58fb/src/ol/source/VectorTile.js#L342-L349
  source.tileGrids_[projection.getCode()] = tileGrid;

  return new ol.layer.VectorTile({
    source,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        width: 5,
      }),
    }),
  });
}
