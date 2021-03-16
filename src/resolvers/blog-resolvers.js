import { v4 as generateId } from "uuid";

export const blogResolvers = {
  Query: {
    blog: (_, { blogId }) => {
      return { id: blogId };
    },
  },
  Blog: {
    author: async (parent) => {
      const { id } = parent;
      return { id };
    },
  },
};
