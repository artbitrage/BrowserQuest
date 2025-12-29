module.exports = Item = Entity.extend({
  init: function (id, kind, x, y) {
    this._super(id, 'item', kind, x, y);
    this.isStatic = false;
    this.isFromChest = false;
  },

  handleDespawn: function (params) {
    this.blinkTimeout = setTimeout(() => {
      params.blinkCallback();
      this.despawnTimeout = setTimeout(params.despawnCallback, params.blinkingDuration);
    }, params.beforeBlinkDelay);
  },

  destroy: function () {
    if (this.blinkTimeout) {
      clearTimeout(this.blinkTimeout);
    }
    if (this.despawnTimeout) {
      clearTimeout(this.despawnTimeout);
    }

    if (this.isStatic) {
      this.scheduleRespawn(30000);
    }
  },

  scheduleRespawn: function (delay) {
    setTimeout(() => {
      if (this.respawn_callback) {
        this.respawn_callback();
      }
    }, delay);
  },

  onRespawn: function (callback) {
    this.respawn_callback = callback;
  },
});
