import { createWriteStream } from "fs";

// file to print logs to
const LOG_FILE = "logs.txt";

// const error levels
const levels = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARN: "WARN",
};

const stream = createWriteStream(LOG_FILE, { flags: "a" });

export function createLogger(location) {
  function info(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.INFO}: ${location}: ${message}\n`;
    stream.write(logLine);
  }

  function error(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.ERROR}: ${location}: ${message}\n`;
    stream.write(logLine);
  }

  function warn(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.WARN}: ${location}: ${message}\n`;
    stream.write(logLine);
  }

  return {
    info,
    error,
    warn,
  };
}
