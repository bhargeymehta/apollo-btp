import { ApolloServer } from "apollo-server";
import { merge } from "lodash";

// local imports
// schema
import { blogTypeDefs } from "./schema/blog-typedefs";
import { messageTypeDefs } from "./schema/message-typedefs";
import { userTypeDefs } from "./schema/user-typedefs";

// resolvers
import { blogResolvers } from "./resolvers/blog-resolvers";
import { userResolvers } from "./resolvers/user-resolvers";

// db related
import { firestore } from "./firebase/admin";
import { collections } from "./firebase/admin";

// auth
import { authenticate } from "./auth/authenticator";

// utilities
import { createLogger } from "./utilities/logger";
import { ErrorCodes } from "./utilities/error-handling";
import { DepthValidator } from "./utilities/depth-validator";

export const server = new ApolloServer({
  debug: false, // this will exclude stack trace in error throws
  typeDefs: [messageTypeDefs, blogTypeDefs, userTypeDefs],
  resolvers: merge(blogResolvers, userResolvers),
  context: () => {
    return {
      firestore,
      collections,
      ErrorCodes,
      createLogger,
      depthValidator: new DepthValidator(),
      authenticate,
    };
  },
});
