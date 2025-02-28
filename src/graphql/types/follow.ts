import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
  type Follow {
    _id: String
    follower: User
    following: User
    createdAt: String
  }

  extend type User {
    followersCount: Int
    followingCount: Int
  }

  type Query {
    followers(userId: String): [User]
    following(userId: String): [User]
    isFollowing(userId: String!): Boolean
  }

  type Mutation {
    follow(userId: String!): Boolean
    unfollow(userId: String!): Boolean
  }
`;