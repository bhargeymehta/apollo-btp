import { createWriteStream } from "fs";
import { config } from "../server-config";

// file to print logs to
const LOG_FILE = "logs.txt";

// const error levels
const levels = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARN: "WARN",
};

// log things to console for dev purposes
const { logInConsole } = config;

const stream = createWriteStream(LOG_FILE, { flags: "a" });

export function createLogger(location) {
  function info(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.INFO}: ${location}: ${message}\n`;
    if (logInConsole) {
      console.log(logLine);
    }
    stream.write(logLine);
  }

  function error(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.ERROR}: ${location}: ${message}\n`;
    if (logInConsole) {
      console.log(logLine);
    }
    stream.write(logLine);
  }

  function warn(message) {
    message = String(message).replace(/\n/g, " ");
    const logLine = `${Date.now()}: ${levels.WARN}: ${location}: ${message}\n`;
    if (logInConsole) {
      console.log(logLine);
    }
    stream.write(logLine);
  }

  return {
    info,
    error,
    warn,
  };
}
