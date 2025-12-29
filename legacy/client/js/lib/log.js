var Logger = function (level) {
  this.level = level;
};

Logger.prototype.info = () => {};
Logger.prototype.debug = () => {};
Logger.prototype.error = () => {};

//>>excludeStart("prodHost", pragmas.prodHost);
Logger.prototype.info = function (message) {
  if (this.level === 'debug' || this.level === 'info') {
    if (window.console) {
      console.info(message);
    }
  }
};

Logger.prototype.debug = function (message) {
  if (this.level === 'debug') {
    if (window.console) {
      console.log(message);
    }
  }
};

Logger.prototype.error = (message, stacktrace) => {
  if (window.console) {
    console.error(message);
    if (stacktrace !== undefined && stacktrace === true) {
      var trace = printStackTrace();
      console.error(trace.join('\n\n'));
      console.error('-----------------------------');
    }
  }
};
//>>excludeEnd("prodHost");

log = new Logger('debug');
