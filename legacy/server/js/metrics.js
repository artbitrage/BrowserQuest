var cls = require('./lib/class'),
  _ = require('underscore');

module.exports = Metrics = Class.extend({
  init: function (config) {
    this.config = config;
    this.client = new (require('memcache').Client)(config.memcached_port, config.memcached_host);
    this.client.connect();

    this.isReady = false;

    this.client.on('connect', () => {
      log.info(
        'Metrics enabled: memcached client connected to ' +
          config.memcached_host +
          ':' +
          config.memcached_port,
      );
      this.isReady = true;
      if (this.ready_callback) {
        this.ready_callback();
      }
    });
  },

  ready: function (callback) {
    this.ready_callback = callback;
  },

  updatePlayerCounters: function (worlds, updatedCallback) {
    var config = this.config,
      numServers = _.size(config.game_servers),
      playerCount = _.reduce(worlds, (sum, world) => sum + world.playerCount, 0);

    if (this.isReady) {
      // Set the number of players on this server
      this.client.set('player_count_' + config.server_name, playerCount, () => {
        var total_players = 0;

        // Recalculate the total number of players and set it
        _.each(config.game_servers, (server) => {
          this.client.get('player_count_' + server.name, (error, result) => {
            var count = result ? Number.parseInt(result) : 0;

            total_players += count;
            numServers -= 1;
            if (numServers === 0) {
              this.client.set('total_players', total_players, () => {
                if (updatedCallback) {
                  updatedCallback(total_players);
                }
              });
            }
          });
        });
      });
    } else {
      log.error('Memcached client not connected');
    }
  },

  updateWorldDistribution: function (worlds) {
    this.client.set('world_distribution_' + this.config.server_name, worlds);
  },

  getOpenWorldCount: function (callback) {
    this.client.get('world_count_' + this.config.server_name, (error, result) => {
      callback(result);
    });
  },

  getTotalPlayers: function (callback) {
    this.client.get('total_players', (error, result) => {
      callback(result);
    });
  },
});
