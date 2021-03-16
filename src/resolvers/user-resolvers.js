import { v4 as generateId } from "uuid";

export const userResolvers = {
  Query: {
    userDetails: async () => {
      return {
        id: generateId(),
        blogs: [generateId(), generateId()],
      };
    },
  },
  Mutation: {
    createNewUser: async (
      _,
      { input: { handle } },
      { collections: { userCollection }, errorCodes, createLogger }
    ) => {
      const logger = createLogger("createNewUser");

      return {
        id: generateId(),
      };
    },
  },
  User: {
    blogs: async (parent) => {
      const { id } = parent;
      const blogIds = [id, id, id, id];
      return blogIds.map((id) => {
        return { id };
      });
    },
  },
};
