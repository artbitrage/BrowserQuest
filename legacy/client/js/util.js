Function.prototype.bind = function (bind) {
  return () => {
    var args = Array.prototype.slice.call(arguments);
    return this.apply(bind || null, args);
  };
};

var isInt = (n) => n % 1 === 0;

var TRANSITIONEND = 'transitionend webkitTransitionEnd oTransitionEnd';

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (() =>
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  ((/* function */ callback, /* DOMElement */ element) => {
    window.setTimeout(callback, 1000 / 60);
  }))();
