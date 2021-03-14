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
  }

  input NewUserInput {
    handle: String!
    firstName: String
    lastName: String
    age: Int
    country: Country
  }

  extend type Mutation {
    createNewUser(input: NewUserInput!): User!
  }
`;
