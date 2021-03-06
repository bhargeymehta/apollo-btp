import { ApolloServer } from "apollo-server";
import { merge } from "lodash";

// local imports
// schema
import { blogTypeDefs } from "./schema/blog-typedefs";
import { userTypeDefs } from "./schema/user-typedefs";

// resolvers
import { blogResolvers } from "./resolvers/blog-resolvers";
import { userResolvers } from "./resolvers/user-resolvers";

// db related
import { firestore, collectionNames, collections } from "./firebase/admin";

// auth
import { authenticator } from "./auth/authenticator";

// utilities
import { createLogger } from "./utilities/logger";
import { ErrorCodes } from "./utilities/error-handling";
import { DepthValidator } from "./utilities/depth-validator";

export const server = new ApolloServer({
  debug: false, // this will exclude stack trace in error throws
  typeDefs: [blogTypeDefs, userTypeDefs],
  resolvers: merge(blogResolvers, userResolvers),
  context: () => {
    return {
      firestore,
      collections,
      collectionNames,
      ErrorCodes,
      createLogger,
      depthValidator: new DepthValidator(),
      authenticator,
    };
  },
});
