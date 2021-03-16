import { collections } from "../firebase/admin";
import { ErrorCodes } from "../utilities/error-handling";

const { userCollection } = collections;

export const authenticate = async (clientId, clientSecret) => {
  const clientDoc = await userCollection.doc(clientId).get();
  if (!clientDoc.exists) {
    throw ErrorCodes.NOTFOUND;
  }

  const { secret } = clientDoc.data();
  if (secret !== clientSecret) {
    throw ErrorCodes.AUTH;
  }
};
