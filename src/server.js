import { ApolloServer } from "apollo-server";
import { merge } from "lodash";

// local imports
// resolvers and schema
import { blogTypeDefs } from "./schema/blog-typedefs";
import { blogResolvers } from "./resolvers/blog-resolvers";
import { messageTypeDefs } from "./schema/message-typedefs";
import { userTypeDefs } from "./schema/user-typedefs";
import { userResolvers } from "./resolvers/user-resolvers";

// db related
import { firestore } from "./firebase/admin";
import { collections } from "./firebase/admin";

// utilities
import { createLogger } from "./utilities/logger";
import { ErrorCodes } from "./utilities/error-handling";

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
    };
  },
});
