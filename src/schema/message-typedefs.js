import { gql } from "apollo-server";

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    content: String!
    sender: User!
    timestamp: String!
  }

  type Chat {
    id: ID!
    participants: [User!]!
    messages: [Message]!
    createdOn: String!
  }

  extend type Query {
    chats(authPacket: AuthUserPacket!): [Chat]!
  }

  input LatestMessageInput {
    chatId: ID!
  }

  type Subscription {
    latestMessage(input: LatestMessageInput!): Message!
  }
`;
