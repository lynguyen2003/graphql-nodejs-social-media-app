import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
    enum MessageContentType {
        text
        image
        video
        audio
    }

    enum ConversationType {
        direct
        group
    }

    type Message {
        _id: String
        sender: User
        content: String
        contentType: MessageContentType
        mediaUrl: String
        readBy: [User]
        conversationId: String
        createdAt: String
        updatedAt: String
        deleted: Boolean
    }

    type Conversation {
        _id: String
        participants: [User]
        type: ConversationType
        name: String
        lastMessage: Message
        createdBy: User
        createdAt: String
        updatedAt: String
        isActive: Boolean
        unreadCount: Int
    }

    type MessageConnection {
        edges: [MessageEdge]
        pageInfo: PageInfo
    }

    type MessageEdge {
        node: Message
        cursor: String
    }

    type ConversationConnection {
        edges: [ConversationEdge]
        pageInfo: PageInfo
    }

    type ConversationEdge {
        node: Conversation
        cursor: String
    }

    input SendMessageInput {
        conversationId: String!
        content: String!
        contentType: MessageContentType
        mediaUrl: String
    }

    input CreateConversationInput {
        participantIds: [String]!
        type: ConversationType
        name: String
        initialMessage: String
    }

    extend type Query {
        conversations(cursor: String, limit: Int): ConversationConnection
        conversation(id: String!): Conversation
        messages(conversationId: String!, cursor: String, limit: Int): MessageConnection
        searchConversations(query: String!): [Conversation]
    }

    extend type Mutation {
        createConversation(input: CreateConversationInput!): Conversation
        sendMessage(input: SendMessageInput!): Message
        markConversationAsRead(conversationId: String!): Boolean
        deleteMessage(messageId: String!): Boolean
        deleteConversation(conversationId: String!): Boolean
    }

    type Subscription {
        messageReceived(conversationId: String): Message
        conversationUpdated: Conversation
    }
`; 