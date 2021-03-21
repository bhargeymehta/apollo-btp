import { ErrorCodes } from "../utilities/error-handling";
import { config } from "../server-config";
import { ApolloError } from "apollo-server-errors";
import { createLogger } from "../utilities/logger";
import { getUser } from "../utilities/misc";

const logger = createLogger("authenticator");
const { enableAuth } = config;

export const authenticator = async (handle, clientSecret) => {
  const clientDoc = await getUser(handle);
  if (enableAuth) {
    const { secret } = clientDoc;

    if (secret !== clientSecret) {
      logger.info(`authenticating user ${handle}: failed`);
      throw new ApolloError(`Client secret doesn't match`, ErrorCodes.AUTH);
    }

    logger.info(`authenticating user ${handle}: success`);
  }
  return clientDoc;
};
