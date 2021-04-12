export const LogLevel = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error"
};

class Logger {
  constructor() {
    this.onLog = null;
  }

  setHandler(logger) {
    this.onLog = logger;
  }

  log(message, level) {
    if (this.onLog) this.onLog(message, level);
  }

  debug(message) {
    this.log(message, LogLevel.Debug);
  }

  info(message) {
    this.log(message, LogLevel.Info);
  }

  warn(message) {
    this.log(message, LogLevel.Warn);
  }

  error(message) {
    this.log(message, LogLevel.Error);
  }
}

export const logger = new Logger();
