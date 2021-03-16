import { collections } from "../firebase/admin";
import { ErrorCodes } from "../utilities/error-handling";
import { config } from "../server-config";
import { ApolloError } from "apollo-server-errors";

const { userCollection } = collections;
const { authenticate: isAuthEnabled } = config;

export const authenticate = async (handle, clientSecret) => {
  if (isAuthEnabled === false) {
    return;
  }
  const clientDoc = await userCollection.where("handle", "==", handle).get();
  if (!clientDoc.exists) {
    throw new ApolloError(
      `Couldn't find user with handle=${handle}`,
      ErrorCodes.AUTH
    );
  }

  const { secret } = clientDoc.data();
  if (secret !== clientSecret) {
    throw new ApolloError(`Client secret doesn't match`, ErrorCodes.AUTH);
  }
};
