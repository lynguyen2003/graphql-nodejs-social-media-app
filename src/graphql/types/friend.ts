import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
    enum Status {
        pending
        accepted
        rejected
        blocked
    }

    type Friend {
        _id: String
        requester: User
        recipient: User
        status: Status
        createdAt: String
        updatedAt: String
    }

    type FriendSuggestion {
        user: User
        mutualFriends: Int
        mutualFriendsList: [User]
    }

    extend type User {
        friendsCount: Int
    }

    type Query {
        friends: [Friend]
        friendRequests: [Friend]
        friendSuggestions(limit: Int): [FriendSuggestion]
        friendshipStatus(userId: String!): Friend
    }

    type Mutation {
        addFriend(userId: String!): Friend
        cancelFriendRequest(requestId: String!): Friend
        acceptFriendRequest(requestId: String!): Friend
        rejectFriendRequest(requestId: String!): Friend
        unfriend(userId: String!): String
        blockUser(userId: String!): Friend
        unblockUser(userId: String!): Boolean
  }
`;