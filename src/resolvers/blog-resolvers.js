import { ApolloError } from "apollo-server-errors";
import { v4 as generateId } from "uuid";
import { getArrayFromSnap } from "../utilities/misc";

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
    timestamp: Date.now(),
    author: clientDoc.id,
  };

  try {
    await firestore().runTransaction(async (transaction) => {
      await transaction.update(userCollection.doc(clientDoc.id), {
        // add the blog id in the blogId list in userDoc
        blogs: firestore.FieldValue.arrayUnion(id),
      });
      await transaction.set(blogCollection.doc(id), newBlog);
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

async function upvoteBlog(
  _,
  { input: { blogId }, authPacket: { handle, secret } },
  context
) {
  const {
    firestore,
    collections: { userCollection, blogCollection },
    collectionNames,
    ErrorCodes,
    createLogger,
    authenticator,
  } = context;
  const logger = createLogger("upvoteBlog");
  const clientDoc = await authenticator(handle, secret);
  delete clientDoc.secret;

  const id = generateId();
  const newUpvote = {
    id,
    upvoter: clientDoc.id,
  };

  await getBlogDocById(blogId, context);

  try {
    await firestore().runTransaction(async (transaction) => {
      const latestClientDoc = (
        await transaction.get(userCollection.doc(clientDoc.id))
      ).data();

      if (latestClientDoc.upvotes.find((upvote) => upvote.blogId === blogId)) {
        throw "duplicate";
      }

      await transaction.update(userCollection.doc(latestClientDoc.id), {
        // add the upvote id in the upvote list in the blog doc
        upvotes: firestore.FieldValue.arrayUnion({ ...newUpvote, blogId }),
      });

      await transaction.set(
        blogCollection
          .doc(blogId)
          .collection(collectionNames.upvotes)
          .doc(newUpvote.id),
        newUpvote
      );
    });
    logger.info(`upvote on blog ${blogId} registered by ${handle}`);
  } catch (err) {
    if (err === "duplicate") {
      logger.info(`Duplicate upvote on ${blogId} by ${handle}`);
      throw new ApolloError(`Duplicate upvote`, ErrorCodes.ALREADYEXISTS);
    }
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Couldn't create upvote`, ErrorCodes.DATABASE);
  }

  return {
    ...newUpvote,
    upvoter: {
      // for gql
      id: newUpvote.upvoter,
    },
  };
}

async function removeUpvote(
  _,
  { input: { blogId }, authPacket: { handle, secret } },
  context
) {
  const {
    firestore,
    collections: { userCollection, blogCollection },
    collectionNames,
    ErrorCodes,
    createLogger,
    authenticator,
  } = context;
  const logger = createLogger("upvoteBlog");
  const clientDoc = await authenticator(handle, secret);
  delete clientDoc.secret;

  await getBlogDocById(blogId, context);

  try {
    await firestore().runTransaction(async (transaction) => {
      const latestClientDoc = (
        await transaction.get(userCollection.doc(clientDoc.id))
      ).data();

      const upvote = latestClientDoc.upvotes.find(
        (upvote) => upvote.blogId === blogId
      );
      if (upvote) {
        await transaction.update(userCollection.doc(latestClientDoc.id), {
          // remove from user's list
          upvotes: firestore.FieldValue.arrayRemove(upvote),
        });

        await transaction.delete(
          blogCollection
            .doc(blogId)
            .collection(collectionNames.upvotes)
            .doc(upvote.id),
          {
            id: upvote.id,
            upvoter: upvote.upvoter,
          }
        );
      } else {
        throw "notpresent";
      }
    });
    logger.info(`upvote on blog ${blogId} registered by ${handle}`);
  } catch (err) {
    if (err === "notpresent") {
      logger.info(`Upvote not found on ${blogId}`);
      throw new ApolloError(`Upvote not found`, ErrorCodes.NOTFOUND);
    }
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Couldn't create upvote`, ErrorCodes.DATABASE);
  }

  return true;
}

async function getBlogDocById(
  id,
  { collections: { blogCollection }, ErrorCodes, createLogger }
) {
  const logger = createLogger("getBlogDocById");
  let blogDoc;
  try {
    blogDoc = await blogCollection.doc(id).get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (!blogDoc.exists) {
    throw new ApolloError(`Blog not found`, ErrorCodes.NOTFOUND);
  }

  return blogDoc.data();
}

const Blog = {
  title: async ({ id }, _, context) => {
    const { title } = getBlogDocById(id, context);
    return title;
  },
  content: async ({ id }, _, context) => {
    const { content } = getBlogDocById(id, context);
    return content;
  },
  upvotes: async (
    { id },
    _,
    {
      collections: { blogCollection },
      collectionNames,
      createLogger,
      ErrorCodes,
    }
  ) => {
    const logger = createLogger("Blog:upvotes");
    let snap;
    try {
      snap = await blogCollection
        .doc(id)
        .collection(collectionNames.upvotes)
        .get();
    } catch (err) {
      logger.error(`Firebase Error: ${err}`);
      throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
    }
    const upvotes = getArrayFromSnap(snap);

    return upvotes.map((upvote) => {
      return {
        id,
        upvoter: {
          id: upvote.upvoter,
        },
      };
    });
  },
  comments: async (
    { id },
    _,
    {
      collections: { blogCollection },
      collectionNames,
      createLogger,
      ErrorCodes,
    }
  ) => {
    const logger = createLogger("Blog:comments");
    let snap;
    try {
      snap = await blogCollection
        .doc(id)
        .collection(collectionNames.comments)
        .get();
    } catch (err) {
      logger.error(`Firebase Error: ${err}`);
      throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
    }
    const comments = getArrayFromSnap(snap);

    return comments.map((comment) => {
      return {
        ...comment,
        commentor: {
          id: comment.commentor,
        },
      };
    });
  },
  timestamp: async ({ id }, _, context) => {
    const { timestamp } = getBlogDocById(id, context);
    return timestamp;
  },
  author: async ({ id }, _, context) => {
    const { author } = getBlogDocById(id, context);
    return author; // id
  },
};

export const blogResolvers = {
  Query: {},
  Mutation: {
    createBlog,
    upvoteBlog,
    removeUpvote,
  },
  Blog,
};
