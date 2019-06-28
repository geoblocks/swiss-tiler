# swiss-tiler

Use tippecanoe to generate vector tiles that are compatible with the [swisstopo tile grid](https://api3.geo.admin.ch/services/sdiservices.html#wmts).

This project is not affiliated with or endorsed by swisstopo.

## Prerequisites

Requires node/npm and [tippecanoe](https://github.com/mapbox/tippecanoe) to be installed.

## Run example

```
$ npm install
$ npm start
```

## Run with your own data

```
$ npx swiss-tiler INPUT_GEOJSON OUTPUT_TILE_DIR
```

## License

This project is licensed under the MIT license, see the LICENSE file.
