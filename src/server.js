import { ApolloServer } from "apollo-server";
import { typeDefs } from "./schema/messages";

const resolvers = {
  Query: {
    books: () => [],
  },
};

export const server = new ApolloServer({ typeDefs, resolvers });
