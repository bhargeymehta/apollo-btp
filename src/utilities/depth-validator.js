import { v4 as generateId } from "uuid";
import { ErrorCodes } from "./error-handling";
import { createLogger } from "./logger";
import { config } from "../server-config";
import { ApolloError } from "apollo-server-errors";

export class DepthValidator {
  constructor() {
    const { queryMaxDepth, queryMaxTimeInSeconds } = config;
    this.maxDepth = queryMaxDepth;
    this.timeoutDuration = queryMaxTimeInSeconds * 1000; // supposed to be in milliseconds
    this.queryMap = new Map();
    this.clientMap = new Map();
    this.logger = createLogger("DepthValidator");
  }

  validate(queryKey, depth) {
    const clientId = this.clientMap.has(queryKey)
      ? this.clientMap.get(queryKey)
      : "public";
    const currentDepth = this.queryMap.get(queryKey);
    if (currentDepth === undefined) {
      this.logger.error(
        `request ${queryKey} by ${clientId} not found, rejecting request`
      );
      throw new ApolloError(`request timed out`, ErrorCodes.DENIED);
    }

    if (depth > this.maxDepth) {
      this.logger.error(
        `request ${queryKey} by ${clientId} exceeded depth, rejecting request`
      );
      throw new ApolloError(
        `request exceeded depth`,
        ErrorCodes.DEPTHVIOLATION
      );
    }

    if (depth === this.maxDepth) {
      this.logger.warn(`request ${queryKey} by ${clientId} reached maxDepth`);
    }

    this.queryMap.set(queryKey, Math.max(depth, currentDepth));
  }

  register(handle = "public") {
    const key = generateId();
    this.queryMap.set(key, 0);
    if (handle !== "public") {
      this.clientMap.set(key, handle);
    }
    setTimeout(() => {
      this.queryMap.delete(key);
      if (handle !== "public") {
        this.clientMap.delete(key);
      }
    }, this.timeoutDuration);
    return key;
  }
}
