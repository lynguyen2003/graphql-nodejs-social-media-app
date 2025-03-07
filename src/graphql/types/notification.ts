import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
    type Notification {
        _id: String
        recipient: User!
        sender: User!
        type: String!
        entityId: String!
        entityType: String!
        message: String!
        isRead: Boolean!
        metadata: JSON
        createdAt: String
        updatedAt: String
    }

    scalar JSON

    type NotificationCount {
        total: Int!
        unread: Int!
    }

    extend type Query {
        notifications(limit: Int, offset: Int): [Notification]
        notificationCount: NotificationCount
    }

    extend type Mutation {
        markNotificationAsRead(id: String!): Notification
        markAllNotificationsAsRead: Boolean
        deleteNotification(id: String!): Boolean
        deleteAllNotifications: Boolean
    }
`; 