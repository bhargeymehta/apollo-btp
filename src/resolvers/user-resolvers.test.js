import { userResolvers } from "./user-resolvers";
import { createContextMock } from "../server.mock";
import { ErrorCodes } from "../utilities/error-handling";

describe("createNewUser", () => {
  const contextMock = createContextMock();
  const {
    Mutation: { createNewUser },
  } = userResolvers;

  it("should throw error when firebase is down", async () => {
    expect.assertions(1);
    const getSpy = jest.spyOn(
      contextMock.collections.userCollection.where(),
      "get"
    );

    getSpy.mockRejectedValue(null);

    try {
      await createNewUser({}, { input: { handle: "something" } }, contextMock);
    } catch (err) {
      const {
        extensions: { code: errorCode },
      } = err;
      expect(errorCode).toBe(ErrorCodes.DATABASE);
    }
  });
});
