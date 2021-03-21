import { default as admin } from "firebase-admin";
import { credentials } from "./db-creds";

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

// firestore
export const firestore = admin.firestore;

// collection names
export const collectionNames = {
  users: "users",
  blogs: "blogs",
  chats: "chats",
  comments: "comments",
  upvotes: "upvotes",
};

// collections
export const collections = {
  userCollection: firestore().collection(collectionNames.users),
  blogCollection: firestore().collection(collectionNames.blogs),
  chatCollection: firestore().collection(collectionNames.chats),
};
