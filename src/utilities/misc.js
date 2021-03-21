import { createLogger } from "./logger";
import { ErrorCodes } from "./error-handling";
import { ApolloError } from "apollo-server-errors";
import { collections } from "../firebase/admin";

export const getArrayFromSnap = (snapshot) => {
  const array = [];
  snapshot.forEach((doc) => array.push(doc.data()));
  return array;
};

export const getUser = async (handle) => {
  const { userCollection } = collections;
  const logger = createLogger("getUser");

  let snap;
  try {
    snap = await userCollection.where("handle", "==", handle).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (snap.empty) {
    throw new ApolloError(
      `Couldn't find user with handle=${handle}`,
      ErrorCodes.NOTFOUND
    );
  }

  const docs = getArrayFromSnap(snap);
  if (docs.length > 1) {
    logger.warn(`found multiple docs for handle:${handle}`);
  }

  const clientDoc = docs[0];
  return clientDoc;
};
