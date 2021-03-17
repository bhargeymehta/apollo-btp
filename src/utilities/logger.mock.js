export const createCreateLoggerMock = () => {
  return (_location) => {
    return {
      info: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };
  };
};
