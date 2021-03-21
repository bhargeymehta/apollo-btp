import { ApolloError } from "apollo-server-errors";
import { v4 as generateId } from "uuid";

export const blogResolvers = {
  Query: {},
  Mutation: {
    createBlog,
  },
  Blog,
  Comment,
  Upvote,
};

async function Blog(
  { id },
  {},
  { collections: blogCollection, ErrorCodes, createLogger }
) {
  const logger = createLogger("Blog");
  let doc;
  try {
    doc = await blogCollection.doc(id).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Couldn't reach database`, ErrorCodes.DATABASE);
  }

  if (!doc.exists) {
    throw new ApolloError(
      `Didn't find blog with id ${id}`,
      ErrorCodes.NOTFOUND
    );
  }

  return doc.data();
}

async function Comment(
  { id },
  {},
  { collections: commentCollection, ErrorCodes, createLogger }
) {
  const logger = createLogger("Comment");
  let doc;
  try {
    doc = await commentCollection.doc(id).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Couldn't reach database`, ErrorCodes.DATABASE);
  }

  if (!doc.exists) {
    throw new ApolloError(
      `Didn't find comment with id ${id}`,
      ErrorCodes.NOTFOUND
    );
  }

  return doc.data();
}

async function Upvote(
  { id },
  {},
  { collections: upvoteCollection, ErrorCodes, createLogger }
) {
  const logger = createLogger("Upvote");
  let doc;
  try {
    doc = await upvoteCollection.doc(id).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Couldn't reach database`, ErrorCodes.DATABASE);
  }

  if (!doc.exists) {
    throw new ApolloError(
      `Didn't find upvote with id ${id}`,
      ErrorCodes.NOTFOUND
    );
  }

  return doc.data();
}

async function createBlog(
  _,
  { input: { title, content }, authPacket: { handle, secret } },
  {
    firestore,
    collections: { blogCollection, userCollection },
    ErrorCodes,
    createLogger,
    authenticator,
  }
) {
  const logger = createLogger("createBlog");
  const clientDoc = await authenticator(handle, secret);
  delete clientDoc.secret;

  const id = generateId();
  const newBlog = {
    id,
    title,
    content,
    upvotes: [],
    comments: [],
    timestamp: Date.now(),
    author: clientDoc.id,
  };

  try {
    await firestore().runTransaction(async (transaction) => {
      await transaction.update(userCollection.doc(clientDoc.id), {
        // add the blog id in the blogId list in userDoc
        blogs: firestore.FieldValue.arrayUnion(id),
      });
      await blogCollection.doc(id).set(newBlog);
    });
    logger.info(`Created blog with id ${id}`);
  } catch (err) {
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Couldn't create blog`, ErrorCodes.DATABASE);
  }

  return {
    ...newBlog,
    author: {
      // for gql
      id: newBlog.author,
    },
  };
}
