import { v4 as generateId } from "uuid";
import { Countries } from "../schema/user-typedefs";
import { getArrayFromSnap } from "../utilities/misc";
import { ApolloError } from "apollo-server-errors";

export const userResolvers = {
  Mutation: {
    createNewUser,
  },
};

async function createNewUser(
  _,
  { input: { handle, firstName, lastName, age, country } },
  { collections: { userCollection }, ErrorCodes, createLogger }
) {
  const logger = createLogger("createNewUser");

  let existingSnap;
  try {
    existingSnap = await userCollection.where("handle", "==", handle).get();
  } catch (err) {
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (!existingSnap.empty) {
    const users = getArrayFromSnap(existingSnap);
    if (users.length > 1) {
      logger.warn(`found multiple docs for handle:${handle}`);
    }
    throw new ApolloError(
      `User with handle=${handle} already exists`,
      ErrorCodes.ALREADYEXISTS
    );
  }

  // change to empty if undefined
  firstName = firstName || "";
  lastName = lastName || "";
  country = country || Countries.EMPTY;
  if (age) {
    if (age <= 0) {
      throw new ApolloError(`Age can't be negative`, ErrorCodes.INVALIDINPUT);
    }
  } else {
    age = -1;
  }

  const id = generateId();
  const secret = generateId();
  const newUser = {
    id,
    comments: [],
    blogs: [],
    upvotes: [],
    likes: [],
    handle,
    firstName,
    lastName,
    age,
    country,
  };

  try {
    await userCollection.doc(id).set({ ...newUser, secret });
  } catch (err) {
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  return {
    user: newUser,
    secret,
  };
}
