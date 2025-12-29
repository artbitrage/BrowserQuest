var Utils = {},
  sanitizer = require('sanitizer'),
  Types = require('../../shared/js/gametypes');

module.exports = Utils;

Utils.sanitize = (string) => {
  // Strip unsafe tags, then escape as html entities.
  return sanitizer.escape(sanitizer.sanitize(string));
};

Utils.random = (range) => Math.floor(Math.random() * range);

Utils.randomRange = (min, max) => min + Math.random() * (max - min);

Utils.randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

Utils.clamp = (min, max, value) => {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
};

Utils.randomOrientation = () => {
  var o,
    r = Utils.random(4);

  if (r === 0) o = Types.Orientations.LEFT;
  if (r === 1) o = Types.Orientations.RIGHT;
  if (r === 2) o = Types.Orientations.UP;
  if (r === 3) o = Types.Orientations.DOWN;

  return o;
};

Utils.Mixin = (target, source) => {
  if (source) {
    for (var key, keys = Object.keys(source), l = keys.length; l--; ) {
      key = keys[l];

      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

Utils.distanceTo = (x, y, x2, y2) => {
  var distX = Math.abs(x - x2);
  var distY = Math.abs(y - y2);

  return distX > distY ? distX : distY;
};
