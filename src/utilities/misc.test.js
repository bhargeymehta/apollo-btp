import { getArrayFromSnap } from "./misc";

describe("getArrayFromSnap", () => {
  it("should iterate over data", () => {
    expect.assertions(1);
    const snap = [createDocMock("foo"), createDocMock("bar")];
    const data = getArrayFromSnap(snap);
    expect(data).toEqual(["foo", "bar"]);
  });
});

const createDocMock = (dataToReturn) => {
  return {
    data: () => dataToReturn,
  };
};
