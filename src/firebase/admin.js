import { default as admin } from "firebase-admin";
import { credentials } from "./db-creds";

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

// firestore
export const firestore = admin.firestore();

// collections
export const collections = {
  userCollection: firestore.collection("users"),
};
