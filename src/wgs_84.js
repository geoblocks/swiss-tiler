// Earth radius as defined in WGS 84, see e.g. https://en.wikipedia.org/wiki/World_Geodetic_System
const radius = 6378137;
const circumference = radius * 2 * Math.PI;

module.exports = { radius, circumference };
