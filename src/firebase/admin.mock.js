// collections
export const createCollectionsMock = () => {
  const query = {
    get: jest.fn(),
  };
  const collections = {
    userCollection: {
      where: () => query,
    },
  };
  return collections;
};
