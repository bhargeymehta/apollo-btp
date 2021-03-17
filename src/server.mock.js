import { createCollectionsMock } from "./firebase/admin.mock";
import { createCreateLoggerMock } from "./utilities/logger.mock";
import { ErrorCodes } from "./utilities/error-handling";

export const createContextMock = () => {
  return {
    firestore: {},
    collections: createCollectionsMock(),
    ErrorCodes,
    createLogger: createCreateLoggerMock(),
    depthValidator: {},
    authenticate: jest.fn(),
  };
};
