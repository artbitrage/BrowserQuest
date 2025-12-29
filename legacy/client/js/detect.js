var Detect = {};

Detect.supportsWebSocket = () => window.WebSocket || window.MozWebSocket;

Detect.userAgentContains = (string) => navigator.userAgent.indexOf(string) != -1;

Detect.isTablet = (screenWidth) => {
  if (screenWidth > 640) {
    if (
      (Detect.userAgentContains('Android') && Detect.userAgentContains('Firefox')) ||
      Detect.userAgentContains('Mobile')
    ) {
      return true;
    }
  }
  return false;
};

Detect.isWindows = () => Detect.userAgentContains('Windows');

Detect.isChromeOnWindows = () =>
  Detect.userAgentContains('Chrome') && Detect.userAgentContains('Windows');

Detect.canPlayMP3 = () => Modernizr.audio.mp3;

Detect.isSafari = () => Detect.userAgentContains('Safari') && !Detect.userAgentContains('Chrome');

Detect.isOpera = () => Detect.userAgentContains('Opera');
