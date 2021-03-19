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

  input UpvoteBlogInput {
    blogId: ID!
  }

  input CreateCommentInput {
    commentContent: String!
  }

  input DeleteCommentInput {
    commentId: ID!
  }

  type Mutation {
    createBlog(input: CreateBlogInput!, authPacket: AuthUserPacket!): Blog!
    upvoteBlog(input: UpvoteBlogInput!, authPacket: AuthUserPacket!): Upvote!
    createComment(
      input: CreateCommentInput!
      authPacket: AuthUserPacket!
    ): Comment!
    deleteComment(
      input: DeleteCommentInput!
      authPacket: AuthUserPacket!
    ): Boolean
  }

  input GetPaginatedBlogs {
    firstCount: Int!
    afterTimestamp: String!
  }

  input GetCommentsInput {
    blogId: ID!
  }

  input GetBlogInput {
    blogId: ID!
  }

  type Query {
    getPaginatedBlogs(input: GetPaginatedBlogs!): [Blog]!
    getComments(input: GetCommentsInput!): [Comment]!
    getBlog(input: GetBlogInput!): Blog!
  }
`;
