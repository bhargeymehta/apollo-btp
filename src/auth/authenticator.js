import { collections } from "../firebase/admin";
import { ErrorCodes } from "../utilities/error-handling";
import { config } from "../server-config";
import { ApolloError } from "apollo-server-errors";
import { createLogger } from "../utilities/logger";
import { getArrayFromSnap } from "../utilities/misc";

const logger = createLogger("authenticator");
const { userCollection } = collections;
const { enableAuth } = config;

export const authenticator = async (handle, clientSecret) => {
  if (!enableAuth) {
    return;
  }
  logger.info(`authenticating user ${handle}`);
  const snap = await userCollection.where("handle", "==", handle).get();
  if (snap.empty) {
    throw new ApolloError(
      `Couldn't find user with handle=${handle}`,
      ErrorCodes.AUTH
    );
  }

  const docs = getArrayFromSnap(snap);
  if (docs.length > 1) {
    logger.warn(`found multiple docs for handle:${handle}`);
  }

  const clientDoc = docs[0];
  const { secret } = clientDoc;
  if (secret !== clientSecret) {
    throw new ApolloError(`Client secret doesn't match`, ErrorCodes.AUTH);
  }

  logger.info(`authenticating user ${handle}: success`);
  return clientDoc;
};
