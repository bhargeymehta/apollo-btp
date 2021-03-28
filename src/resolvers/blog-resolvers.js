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
    depthValidator,
  }
) {
  const requestKey = depthValidator.register(handle);
  const depth = 0;
  depthValidator.validate(requestKey, depth);

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
    requestKey,
    depth: depth + 1,
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
    depthValidator,
  } = context;
  const requestKey = depthValidator.register(handle);
  const depth = 0;
  depthValidator.validate(requestKey, depth);

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
        upvotes: firestore.FieldValue.arrayUnion({ id: newUpvote.id, blogId }),
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
    blogId,
    upvoter: {
      // for gql
      id: newUpvote.upvoter,
    },
    requestKey,
    depth: depth + 1,
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
    depthValidator,
  } = context;

  const requestKey = depthValidator.register(handle);
  const depth = 0;
  depthValidator.validate(requestKey, depth);

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
          upvote
        );
      } else {
        throw "notpresent";
      }
    });
    logger.info(`upvote on blog ${blogId} removed by ${handle}`);
  } catch (err) {
    if (err === "notpresent") {
      logger.info(`Upvote not found on ${blogId}`);
      throw new ApolloError(`Upvote not found`, ErrorCodes.NOTFOUND);
    }
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Couldn't remove upvote`, ErrorCodes.DATABASE);
  }

  return true;
}

async function createComment(
  _,
  { input: { blogId, content }, authPacket: { handle, secret } },
  context
) {
  const {
    firestore,
    collections: { userCollection, blogCollection },
    collectionNames,
    ErrorCodes,
    createLogger,
    authenticator,
    depthValidator,
  } = context;

  const requestKey = depthValidator.register(handle);
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const logger = createLogger("createComment");
  const clientDoc = await authenticator(handle, secret);
  delete clientDoc.secret;

  const id = generateId();
  const newComment = {
    id,
    content,
    commentor: clientDoc.id,
    timestamp: Date.now(),
  };

  await getBlogDocById(blogId, context);

  try {
    await firestore().runTransaction(async (transaction) => {
      await transaction.update(userCollection.doc(clientDoc.id), {
        // add the upvote id in the upvote list in the blog doc
        comments: firestore.FieldValue.arrayUnion({
          id: newComment.id,
          blogId,
        }),
      });

      await transaction.set(
        blogCollection
          .doc(blogId)
          .collection(collectionNames.comments)
          .doc(newComment.id),
        newComment
      );
    });
    logger.info(`comment on blog ${blogId} by ${handle}`);
  } catch (err) {
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Couldn't create comment`, ErrorCodes.DATABASE);
  }

  return {
    ...newComment,
    blogId,
    commentor: {
      // for gql
      id: newComment.commentor,
    },
    requestKey,
    depth: depth + 1,
  };
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
  title: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { title } = await getBlogDocById(id, context);
    return title;
  },
  content: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { content } = await getBlogDocById(id, context);
    return content;
  },
  upvotes: async (
    { id, requestKey, depth },
    _,
    {
      collections: { blogCollection },
      collectionNames,
      createLogger,
      ErrorCodes,
      depthValidator,
    }
  ) => {
    depthValidator.validate(requestKey, depth);

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

    return upvotes.map((upvote) => ({
      id: upvote.id,
      blogId: id,
      upvoter: {
        id: upvote.upvoter,
      },
      requestKey,
      depth: depth + 1,
    }));
  },
  comments: async (
    { id, requestKey, depth },
    _,
    {
      collections: { blogCollection },
      collectionNames,
      createLogger,
      ErrorCodes,
      depthValidator,
    }
  ) => {
    depthValidator.validate(requestKey, depth);

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

    return comments.map((comment) => ({
      ...comment,
      blogId: id,
      commentor: {
        id: comment.commentor,
      },
      requestKey,
      depth: depth + 1,
    }));
  },
  timestamp: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { timestamp } = await getBlogDocById(id, context);
    return timestamp;
  },
  author: async ({ id, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { author } = await getBlogDocById(id, context);
    return {
      id: author,
      requestKey,
      depth: depth + 1,
    }; // id
  },
};

const Comment = {
  timestamp: async ({ id, blogId, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { timestamp } = await getCommentDocById(id, blogId, context);
    return timestamp;
  },
  content: async ({ id, blogId, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { content } = await getCommentDocById(id, blogId, context);
    return content;
  },
  commentor: async ({ id, blogId, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { commentor } = await getCommentDocById(id, blogId, context);
    return {
      id: commentor,
      requestKey,
      depth: depth + 1,
    }; // id
  },
};

async function getCommentDocById(
  id,
  blogId,
  { collections: { blogCollection }, ErrorCodes, createLogger, collectionNames }
) {
  const logger = createLogger("getCommentDocById");
  let commentDoc;
  try {
    commentDoc = await blogCollection
      .doc(blogId)
      .collection(collectionNames.comments)
      .doc(id)
      .get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (!commentDoc.exists) {
    throw new ApolloError(`Comment not found`, ErrorCodes.NOTFOUND);
  }

  return commentDoc.data();
}

async function getUpvoteDocById(
  id,
  blogId,
  { collections: { blogCollection }, ErrorCodes, createLogger, collectionNames }
) {
  const logger = createLogger("getUpvoteDocById");
  let upvoteDoc;
  try {
    upvoteDoc = await blogCollection
      .doc(blogId)
      .collection(collectionNames.upvotes)
      .doc(id)
      .get();
  } catch (err) {
    logger.error(`Firebase Error ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  if (!upvoteDoc.exists) {
    throw new ApolloError(`Upvote not found`, ErrorCodes.NOTFOUND);
  }

  return upvoteDoc.data();
}

const Upvote = {
  upvoter: async ({ id, blogId, requestKey, depth }, _, context) => {
    const { depthValidator } = context;
    depthValidator.validate(requestKey, depth);

    const { upvoter } = await getUpvoteDocById(id, blogId, context);
    return {
      id: upvoter,
      requestKey,
      depth: depth + 1,
    };
  },
};

async function getPaginatedBlogs(
  _,
  { input: { firstCount, afterTimestamp } },
  context
) {
  const { depthValidator } = context;
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const {
    collections: { blogCollection },
    createLogger,
    ErrorCodes,
  } = context;
  const logger = createLogger("getPaginatedBlogs");

  let snap;
  try {
    snap = await blogCollection
      .orderBy("timestamp")
      .startAfter(parseInt(afterTimestamp))
      .limit(firstCount)
      .get();
  } catch (err) {
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATBASE);
  }

  return getArrayFromSnap(snap);
}

async function getComments(
  _,
  { input: { blogId } },
  {
    collections: { blogCollection },
    collectionNames,
    createLogger,
    ErrorCodes,
    depthValidator,
  }
) {
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const logger = createLogger("getComments");

  let snap;
  try {
    snap = await blogCollection
      .doc(blogId)
      .collection(collectionNames.comments)
      .get();
  } catch (err) {
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  const comments = getArrayFromSnap(snap);
  return comments.map(({ id, commentor }) => ({
    id,
    blogId,
    commentor: {
      id: commentor,
    },
    requestKey,
    depth: depth + 1,
  }));
}

async function getUpvotes(
  _,
  { input: { blogId } },
  {
    collections: { blogCollection },
    collectionNames,
    createLogger,
    ErrorCodes,
    depthValidator,
  }
) {
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const logger = createLogger("getUpvotes");

  let snap;
  try {
    snap = await blogCollection
      .doc(blogId)
      .collection(collectionNames.upvotes)
      .get();
  } catch (err) {
    logger.error(`Firebase Error: ${err}`);
    throw new ApolloError(`Can't reach database`, ErrorCodes.DATABASE);
  }

  const comments = getArrayFromSnap(snap);
  return comments.map(({ id, upvoter }) => ({
    id,
    blogId,
    upvoter: {
      id: upvoter,
    },
    requestKey,
    depth: depth + 1,
  }));
}

async function getBlog(_, { input: { blogId } }, context) {
  const { depthValidator } = context;
  const requestKey = depthValidator.register();
  const depth = 0;
  depthValidator.validate(requestKey, depth);

  const blogDoc = await getBlogDocById(blogId, context);
  return {
    ...blogDoc,
    author: {
      id: blogDoc.author,
    },
    blogId,
    requestKey,
    depth: depth + 1,
  };
}

export const blogResolvers = {
  Query: {
    getPaginatedBlogs,
    getComments,
    getUpvotes,
    getBlog,
  },
  Mutation: {
    createBlog,
    upvoteBlog,
    removeUpvote,
    createComment,
  },
  Blog,
  Comment,
  Upvote,
};
