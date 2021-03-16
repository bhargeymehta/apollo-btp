import { v4 as generateId } from "uuid";
import { ErrorCodes } from "./error-handling";
import { createLogger } from "./logger";
import { config } from "../server-config";

export class DepthValidator {
  constructor() {
    const { queryMaxDepth, queryMaxTimeInSeconds } = config;
    this.maxDepth = queryMaxDepth;
    this.timeoutDuration = queryMaxTimeInSeconds * 1000; // supposed to be in milliseconds
    this.queryMap = new Map();
    this.logger = createLogger("DepthValidator");
  }

  validate(queryKey, depth, clientId) {
    const currentDepth = this.queryMap.get(queryKey);
    if (!currentDepth) {
      this.logger.error("request not found, rejecting request");
      throw ErrorCodes.INTERNAL;
    }

    if (depth > this.maxDepth) {
      this.logger.error("request exceeded depth, rejecting request");
      throw ErrorCodes.DEPTHVIOLATION;
    }

    if (depth === this.maxDepth) {
      this.logger.warn(`client ${clientId} reached maxDepth`);
    }

    this.queryMap.set(queryKey, Math.max(depth, currentDepth));
  }

  register() {
    const key = generateId();
    this.queryMap.set(key, 0);
    setTimeout(() => this.queryMap.delete(key), this.timeoutDuration);
    return key;
  }
}
