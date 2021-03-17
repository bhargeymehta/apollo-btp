import { gql } from "apollo-server";

export const userTypeDefs = gql`
  type User {
    id: ID!
    comments: [Comment]!
    blogs: [Blog]!
    upvotes: [Upvote]!
    likes: [Like]!
    handle: String!
    firstName: String
    lastName: String
    age: Int
    country: Country
  }

  enum Country {
    INDIA
    USA
    CHINA
    RUSSIA
    EMPTY
  }

  input NewUserInput {
    handle: String!
    firstName: String
    lastName: String
    age: Int
    country: Country
  }

  type NewUserPacket {
    user: User!
    secret: String!
  }

  input ChangeSecretInput {
    handle: ID!
    newSecret: String!
  }

  input EditUserDetailsInput {
    handle: ID!
    firstName: String
    lastName: String
    age: Int
    country: Country
  }

  input GetUserDetailsInput {
    requestedHandle: ID!
  }

  extend type Mutation {
    createNewUser(input: NewUserInput!): NewUserPacket!
    changeSecret(input: ChangeSecretInput!, secret: String!): Boolean
    editUserDetails(input: EditUserDetailsInput!, secret: String!): Boolean
  }

  extend type Query {
    getUserDetails(input: GetUserDetailsInput!): User!
  }
`;

export const Countries = {
  INDIA: "INDIA",
  USA: "USA",
  CHINA: "CHINA",
  RUSSIA: "RUSSIA",
  EMPTY: "EMPTY",
};
