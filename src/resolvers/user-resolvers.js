import { v4 as generateId } from "uuid";

export const userResolvers = {
  Mutation: {
    createNewUser: async (
      _,
      { input: { handle } },
      { collections: { userCollection }, errorCodes, createLogger }
    ) => {
      const logger = createLogger("createNewUser");

      const users = [];
      try {
        (await userCollection.get()).forEach((doc) =>
          users.push({ id: doc.id, data: doc.data() })
        );
      } catch (err) {
        logger.error(err.message);
        throw new Error(errorCodes.DB);
      }

      console.log(users);
      return {
        id: generateId(),
      };
    },
  },
};
