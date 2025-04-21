import { UserInputError } from 'apollo-server-express';
import { withFilter, PubSub } from 'graphql-subscriptions';
import mongoose from 'mongoose';

// Use explicit typing to access asyncIterator method
const pubsub = new PubSub() as any;
const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
const CONVERSATION_UPDATED = 'CONVERSATION_UPDATED';

export default {
  Query: {
    conversations: async (parent, { cursor, limit = 10 }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Find conversations where the user is a participant
      let query: any = {
        participants: user._id,
        isActive: true
      };
      
      // Support pagination
      if (cursor) {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
        const [id, createdAt] = decodedCursor.split('_');
        query._id = { $lt: new mongoose.Types.ObjectId(id) };
      }
      
      // Fetch conversations with lastMessage and participants
      const conversations = await context.di.model.Conversations
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .populate({
          path: 'createdBy',
          select: '_id username imageUrl'
        })
        .lean();
      
      // Check if we have more results
      const hasNextPage = conversations.length > limit;
      const edges = hasNextPage ? conversations.slice(0, limit) : conversations;
      
      // Add unreadCount to each conversation
      const conversationsWithUnreadCount = await Promise.all(edges.map(async (conversation) => {
        // Count messages not read by the user
        const unreadCount = await context.di.model.Messages.countDocuments({
          conversationId: conversation._id,
          sender: { $ne: user._id },
          readBy: { $ne: user._id },
          deleted: false
        });
        
        return {
          ...conversation,
          unreadCount
        };
      }));
      
      // Create cursor for pagination
      const lastConversation = conversationsWithUnreadCount[conversationsWithUnreadCount.length - 1];
      const endCursor = lastConversation 
        ? Buffer.from(`${lastConversation._id}_${lastConversation.createdAt}`).toString('base64')
        : null;
      
      return {
        edges: conversationsWithUnreadCount.map(conversation => ({
          node: conversation,
          cursor: Buffer.from(`${conversation._id}_${conversation.createdAt}`).toString('base64')
        })),
        pageInfo: {
          hasNextPage,
          endCursor
        }
      };
    },
    
    conversation: async (parent, { id }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Find the conversation
      const conversation = await context.di.model.Conversations
        .findOne({ 
          _id: id,
          participants: user._id,
          isActive: true 
        })
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .populate({
          path: 'createdBy',
          select: '_id username imageUrl'
        })
        .lean();
      
      if (!conversation) {
        throw new UserInputError('Conversation not found');
      }
      
      // Count unread messages
      const unreadCount = await context.di.model.Messages.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: user._id },
        readBy: { $ne: user._id },
        deleted: false
      });
      
      return {
        ...conversation,
        unreadCount
      };
    },
    
    messages: async (parent, { conversationId, cursor, limit = 20 }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Check if user is a participant in the conversation
      const conversation = await context.di.model.Conversations.findOne({
        _id: conversationId,
        participants: user._id,
        isActive: true
      });
      
      if (!conversation) {
        throw new UserInputError('Conversation not found or you are not a participant');
      }
      
      // Build query
      let query: any = {
        conversationId,
        deleted: false
      };
      
      // Support pagination
      if (cursor) {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
        const [id, createdAt] = decodedCursor.split('_');
        query._id = { $lt: new mongoose.Types.ObjectId(id) };
      }
      
      // Fetch messages
      const messages = await context.di.model.Messages
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate({
          path: 'sender',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'readBy',
          select: '_id username'
        })
        .lean();
      
      // Check if we have more results
      const hasNextPage = messages.length > limit;
      const edges = hasNextPage ? messages.slice(0, limit) : messages;
      
      // Create cursor for pagination
      const lastMessage = edges[edges.length - 1];
      const endCursor = lastMessage 
        ? Buffer.from(`${lastMessage._id}_${lastMessage.createdAt}`).toString('base64')
        : null;
      
      return {
        edges: edges.map(message => ({
          node: message,
          cursor: Buffer.from(`${message._id}_${message.createdAt}`).toString('base64')
        })),
        pageInfo: {
          hasNextPage,
          endCursor
        }
      };
    },
    
    searchConversations: async (parent, { query }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Find conversations where the user is a participant
      // and either the name contains the query or a participant's name contains the query
      const userConversations = await context.di.model.Conversations
        .find({ 
          participants: user._id,
          isActive: true
        })
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .lean();
      
      // Filter conversations based on the search query
      const filteredConversations = userConversations.filter(conversation => {
        // Check if conversation name contains query
        if (conversation.name && conversation.name.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }
        
        // Check if any participant's username contains query
        const otherParticipants = conversation.participants.filter(
          participant => participant._id.toString() !== user._id.toString()
        );
        
        return otherParticipants.some(
          participant => participant.username.toLowerCase().includes(query.toLowerCase())
        );
      });
      
      // Add unreadCount to each conversation
      const conversationsWithUnreadCount = await Promise.all(filteredConversations.map(async (conversation) => {
        // Count messages not read by the user
        const unreadCount = await context.di.model.Messages.countDocuments({
          conversationId: conversation._id,
          sender: { $ne: user._id },
          readBy: { $ne: user._id },
          deleted: false
        });
        
        return {
          ...conversation,
          unreadCount
        };
      }));
      
      return conversationsWithUnreadCount;
    }
  },
  
  Mutation: {
    createConversation: async (parent, { input }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      const { participantIds, type = 'direct', name = null, initialMessage = null } = input;
      
      // Ensure creator is included in participants
      if (!participantIds.includes(user._id.toString())) {
        participantIds.push(user._id.toString());
      }
      
      // Validate participants
      const participants = await context.di.model.Users.find({
        _id: { $in: participantIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      
      if (participants.length !== participantIds.length) {
        throw new UserInputError('One or more participants not found');
      }
      
      // For direct conversations, check if a conversation already exists
      /* if (type === 'direct' && participantIds.length === 2) {
        const existingConversation = await context.di.model.Conversations.findOne({
          type: 'direct',
          participants: { 
            $all: participantIds.map(id => new mongoose.Types.ObjectId(id)),
            $size: 2
          },
          isActive: true
        })
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .populate({
          path: 'createdBy',
          select: '_id username imageUrl'
        });
        
        if (existingConversation) {
          // If exists, return the existing conversation
          return existingConversation;
        }
      } */
      
      // Create a new conversation
      const newConversation = new context.di.model.Conversations({
        participants: participantIds.map(id => new mongoose.Types.ObjectId(id)),
        type,
        name: type === 'group' ? name : null,
        createdBy: user._id,
        isActive: true
      });
      
      await newConversation.save();
      
      // Send initial message if provided
      if (initialMessage) {
        const message = new context.di.model.Messages({
          sender: user._id,
          content: initialMessage,
          contentType: 'text',
          readBy: [user._id],
          conversationId: newConversation._id
        });
        
        await message.save();
        
        // Update conversation with last message
        newConversation.lastMessage = message._id;
        await newConversation.save();
      }
      
      // Populate conversation details
      const populatedConversation = await context.di.model.Conversations
        .findById(newConversation._id)
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .populate({
          path: 'createdBy',
          select: '_id username imageUrl'
        });
      
      // Publish conversation update
      pubsub.publish(CONVERSATION_UPDATED, { 
        conversationUpdated: populatedConversation 
      });
      
      return populatedConversation;
    },
    
    sendMessage: async (parent, { input }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      const { conversationId, content, contentType = 'text', mediaUrl = null } = input;
      
      // Check if user is a participant in the conversation
      const conversation = await context.di.model.Conversations.findOne({
        _id: conversationId,
        participants: user._id,
        isActive: true
      });
      
      if (!conversation) {
        throw new UserInputError('Conversation not found or you are not a participant');
      }
      
      // Create and save the message
      const message = new context.di.model.Messages({
        sender: user._id,
        content,
        contentType,
        mediaUrl,
        readBy: [user._id],
        conversationId
      });
      
      await message.save();
      
      // Update the conversation's lastMessage
      conversation.lastMessage = message._id;
      await conversation.save();
      
      // Populate message details
      const populatedMessage = await context.di.model.Messages
        .findById(message._id)
        .populate({
          path: 'sender',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'readBy',
          select: '_id username'
        });
      
      // Publish message to subscribers
      pubsub.publish(MESSAGE_RECEIVED, { 
        messageReceived: populatedMessage,
        conversationId
      });
      
      // Also update the conversation for all participants
      const updatedConversation = await context.di.model.Conversations
        .findById(conversationId)
        .populate({
          path: 'participants',
          select: '_id username imageUrl'
        })
        .populate({
          path: 'lastMessage',
          select: '_id content contentType createdAt sender',
          populate: {
            path: 'sender',
            select: '_id username imageUrl'
          }
        })
        .populate({
          path: 'createdBy',
          select: '_id username imageUrl'
        });
      
      pubsub.publish(CONVERSATION_UPDATED, { 
        conversationUpdated: updatedConversation 
      });
      
      return populatedMessage;
    },
    
    markConversationAsRead: async (parent, { conversationId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Check if user is a participant
      const conversation = await context.di.model.Conversations.findOne({
        _id: conversationId,
        participants: user._id,
        isActive: true
      });
      
      if (!conversation) {
        throw new UserInputError('Conversation not found or you are not a participant');
      }
      
      // Update all unread messages
      await context.di.model.Messages.updateMany(
        {
          conversationId,
          readBy: { $ne: user._id },
          sender: { $ne: user._id }
        },
        { $addToSet: { readBy: user._id } }
      );
      
      return true;
    },
    
    deleteMessage: async (parent, { messageId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Find the message
      const message = await context.di.model.Messages.findById(messageId);
      
      if (!message) {
        throw new UserInputError('Message not found');
      }
      
      // Check if user is the sender
      if (message.sender.toString() !== user._id.toString()) {
        throw new UserInputError('You can only delete your own messages');
      }
      
      // Soft delete the message
      message.deleted = true;
      await message.save();
      
      // If this was the last message in conversation, update lastMessage
      const conversation = await context.di.model.Conversations.findById(message.conversationId);
      
      if (conversation.lastMessage && conversation.lastMessage.toString() === messageId) {
        // Find the new last message
        const newLastMessage = await context.di.model.Messages
          .findOne({
            conversationId: conversation._id,
            deleted: false
          })
          .sort({ createdAt: -1 });
        
        if (newLastMessage) {
          conversation.lastMessage = newLastMessage._id;
        } else {
          conversation.lastMessage = null;
        }
        
        await conversation.save();
        
        // Publish conversation update
        const updatedConversation = await context.di.model.Conversations
          .findById(conversation._id)
          .populate({
            path: 'participants',
            select: '_id username imageUrl'
          })
          .populate({
            path: 'lastMessage',
            select: '_id content contentType createdAt sender',
            populate: {
              path: 'sender',
              select: '_id username imageUrl'
            }
          })
          .populate({
            path: 'createdBy',
            select: '_id username imageUrl'
          });
        
        pubsub.publish(CONVERSATION_UPDATED, { 
          conversationUpdated: updatedConversation 
        });
      }
      
      return true;
    },
    
    deleteConversation: async (parent, { conversationId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      // Find the conversation
      const conversation = await context.di.model.Conversations.findById(conversationId);
      
      if (!conversation) {
        throw new UserInputError('Conversation not found');
      }
      
      // For direct conversations, just mark as inactive
      conversation.isActive = false;
      await conversation.save();
      
      return true;
    }
  },
  
  Subscription: {
    messageReceived: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(MESSAGE_RECEIVED),
        async (payload, variables, context) => {
          if (variables.conversationId) {
            return payload.messageReceived.conversation.toString() === variables.conversationId;
          }
          
          return true;
        }
      )
    },
    
    conversationUpdated: {
      subscribe: () => pubsub.asyncIterator([CONVERSATION_UPDATED])
    }
  }
}; 