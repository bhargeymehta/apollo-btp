export const blogResolvers = {
  Query: {
    blog: (_, { blogId }) => {
      return { id: blogId };
    },
  },
};
