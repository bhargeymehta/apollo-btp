import { gql } from "apollo-server";

export const blogTypeDefs = gql`
  type Blog {
    id: ID!
    title: String!
    content: String!
    likes: [Like]!
    comments: [Comment]! # 0 comments => empty array
    timestamp: String!
    author: User!
  }

  type Comment {
    id: ID!
    content: String!
    commentor: User!
    upvotes: [Upvote]!
    replies: [Comment]!
    timestamp: String!
  }

  type Like {
    id: ID!
    liker: User!
  }

  type Upvote {
    id: ID!
    upvoter: User!
  }

  type Query {
    blog(blogId: ID!): Blog
    blogsCreatedBy(userId: ID!): [Blog]
  }

  input CreateBlogInput {
    title: String!
    content: String!
    creatorId: ID!
  }

  type Mutation {
    createBlog(input: CreateBlogInput): Blog!
  }
`;
