import { credentials } from "./db-creds";

describe("firebase creds", () => {
  it("should export firebase creds", () => {
    expect.assertions(1);
    expect(credentials).toBeDefined();
  });
});
