import { gql } from "apollo-server";

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    content: String!
    sender: User!
    recipient: User!
    timestamp: String!
  }

  type Chat {
    id: ID!
    participants: [User!]!
    messages: [Message]!
    createdOn: String!
  }
`;
