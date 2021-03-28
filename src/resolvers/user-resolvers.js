import { v4 as generateId } from "uuid";
import { Countries } from "../schema/user-typedefs";
import { getArrayFromSnap, getUser } from "../utilities/misc";
import { ApolloError } from "apollo-server-errors";

async function createNewUser(
  _,
  { input: { handle, firstName, lastName, age, country } },
  { collections: { userCollection }, ErrorCodes, createLogger, depthValidator }
) {
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

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
    chats: [],
    handle,
    firstName,
    lastName,
    age,
    country,
  };

  try {
    await userCollection.doc(id).set({ ...newUser, secret });
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  logger.info(`registered new user: ${handle}`);
  return {
    user: newUser,
    secret,
    requestKey,
    depth: depth + 1,
  };
}

async function changeSecret(
  _,
  { input: { handle, newSecret }, secret },
  { collections: { userCollection }, ErrorCodes, createLogger, authenticator }
) {
  const clientDoc = await authenticator(handle, secret);
  const logger = createLogger("changeSecret");

  try {
    await userCollection.doc(clientDoc.id).set(
      {
        secret: newSecret,
      },
      { merge: true }
    );
    logger.info(`changed secret for user:${handle}`);
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  return true;
}

async function editUserDetails(
  _,
  { input: { handle, firstName, lastName, age, country }, secret },
  { collections: { userCollection }, ErrorCodes, createLogger, authenticator }
) {
  const clientDoc = await authenticator(handle, secret);
  const logger = createLogger("editUserDetails");

  const newFirstName = firstName || clientDoc.firstName;
  const newLastName = lastName || clientDoc.lastName;
  const newAge = (age > 0 ? age : undefined) || clientDoc.age;
  const newCountry = country || clientDoc.country;

  try {
    await userCollection.doc(clientDoc.id).set(
      {
        firstName: newFirstName,
        lastName: newLastName,
        age: newAge,
        country: newCountry,
      },
      { merge: true }
    );
    logger.info(`changed details for user:${handle}`);
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  return true;
}

async function getUserDetails(
  _,
  { input: { requestedHandle } },
  { depthValidator }
) {
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const user = getUser(requestedHandle);

  delete user.secret;
  return {
    ...user,
    requestKey,
    depth: depth + 1,
  };
}

const User = {
  comments: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { comments } = await getUserDocById(id, context);
    return comments.map(({ id, blogId }) => ({
      id,
      blogId,
      requestKey,
      depth: depth + 1,
    }));
  },
  blogs: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { blogs } = await getUserDocById(id, context);
    return blogs.map((id) => ({
      id,
      requestKey,
      depth: depth + 1,
    }));
  },
  upvotes: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { upvotes } = await getUserDocById(id, context);
    return upvotes.map(({ id, blogId }) => ({
      id,
      blogId,
      requestKey,
      depth: depth + 1,
    }));
  },
  handle: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { handle } = await getUserDocById(id, context);
    return handle;
  },
  firstName: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const firstName = await getUserDocById(id, context);
    return firstName;
  },
  lastName: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { lastName } = await getUserDocById(id, context);
    return lastName;
  },
  age: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { age } = await getUserDocById(id, context);
    if (age < 0) return null;
    return age;
  },
  country: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { country } = await getUserDocById(id, context);
    return country;
  },
};

async function getUserDocById(
  id,
  { collections: { userCollection }, ErrorCodes, createLogger }
) {
  const logger = createLogger("getUserDocById");
  let userDoc;
  try {
    userDoc = await userCollection.doc(id).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (!userDoc.exists) {
    throw new ApolloError(`User not found`, ErrorCodes.NOTFOUND);
  }

  return userDoc.data();
}

export const userResolvers = {
  Mutation: {
    createNewUser,
    changeSecret,
    editUserDetails,
  },
  Query: {
    getUserDetails,
  },
  User,
};
