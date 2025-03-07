import { gql } from "apollo-server-express";

export default /* GraphQL */ gql`
    type Comment {
        _id: ID!
        post: Post!
        author: User!
        content: String!
        parentComment: Comment
        likes: [User]
        mentions: [User]
        createdAt: String
        updatedAt: String
    }

    extend type Comment {
        likeCount: Int
        replies: [Comment]
    }

    input CommentInput {
        _id: String
        postId: String
        content: String
        parentCommentId: String
        mentions: [String]
    }

    type Query {
        comments(postId: ID!, parentCommentId: ID): [Comment]
        comment(id: String!): Comment
    }

    type Mutation {
        addComment(input: CommentInput!): Comment
        editComment(input: CommentInput!): Comment!
        deleteComment(id: String!): Comment
        toggleLikeComment(id: String!): Comment!
    }
        
`
