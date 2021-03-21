import { gql } from "apollo-server";

export const blogTypeDefs = gql`
  type Blog {
    id: ID!
    title: String!
    content: String!
    upvotes: [Upvote]!
    comments: [Comment]! # 0 comments => empty array
    timestamp: String!
    author: User!
  }

  type Comment {
    id: ID!
    content: String!
    commentor: User!
    timestamp: String!
  }

  type Upvote {
    id: ID!
    upvoter: User!
  }

  input AuthUserPacket {
    handle: ID!
    secret: String!
  }

  input CreateBlogInput {
    title: String!
    content: String!
  }

  input UpvoteChangeInput {
    blogId: ID!
  }

  input CreateCommentInput {
    blogId: ID!
    content: String!
  }

  type Mutation {
    createBlog(input: CreateBlogInput!, authPacket: AuthUserPacket!): Blog!
    upvoteBlog(input: UpvoteChangeInput!, authPacket: AuthUserPacket!): Upvote!
    removeUpvote(
      input: UpvoteChangeInput!
      authPacket: AuthUserPacket!
    ): Boolean
    createComment(
      input: CreateCommentInput!
      authPacket: AuthUserPacket!
    ): Comment!
  }

  input GetPaginatedBlogsInput {
    firstCount: Int!
    afterTimestamp: String!
  }

  input GetCommentsInput {
    blogId: ID!
  }

  input GetUpvotesInput {
    blogId: ID!
  }

  input GetBlogInput {
    blogId: ID!
  }

  type Query {
    getPaginatedBlogs(input: GetPaginatedBlogsInput!): [Blog]!
    getComments(input: GetCommentsInput!): [Comment]!
    getUpvotes(input: GetUpvotesInput!): [Upvote]!
    getBlog(input: GetBlogInput!): Blog!
  }
`;
