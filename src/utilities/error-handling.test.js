import { ErrorCodes } from "./error-handling";

describe("error-handling", () => {
  it("should export codes", () => {
    expect.assertions(1);
    expect(ErrorCodes).toBeDefined();
  });
});
