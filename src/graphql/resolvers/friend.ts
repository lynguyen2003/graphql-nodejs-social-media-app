import { UserInputError } from "apollo-server-express";
import mongoose from "mongoose";
import { createFriendAcceptNotification, createFriendRequestNotification } from "../../services/notification/notificationService";

export default {
  Query: {
    friends: async (parent, args, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      const friends = await context.di.model.Friends.find({
        $or: [
          { requester: user._id, status: 'accepted' },
          { recipient: user._id, status: 'accepted' }
        ]
      }).populate('requester recipient').lean();

      return friends;
    },
    friendRequests: async (parent, args, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      return await context.di.model.Friends.find({
        recipient: user._id,
        status: 'pending'
      }).populate('requester recipient').lean();
    },
    friendSuggestions: async (parent, { limit = 10 }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      const friendships = await context.di.model.Friends.find({
        $or: [
          { requester: user._id, status: 'accepted' },
          { recipient: user._id, status: 'accepted' }
        ]
      });
      
      const friendIds = friendships.map(value => 
        value.requester.toString() === user._id.toString() 
          ? value.recipient 
          : value.requester
      );
      
      const blocked = await context.di.model.Friend.find({
        $or: [
          { requester: user._id, status: 'blocked' },
          { recipient: user._id, status: 'blocked' }
        ]
      });
      
      const blockedIds = blocked.map(value => 
        value.requester.toString() === user._id.toString() 
          ? value.recipient 
          : value.requester
      );
      
      const pending = await context.di.model.Friend.find({
        $or: [
          { requester: user._id, status: 'pending' },
          { recipient: user._id, status: 'pending' }
        ]
      });
      
      const pendingIds = pending.map(value => 
        value.requester.toString() === user._id.toString() 
          ? value.recipient 
          : value.requester
      );
      
      const excludeIds = [
        user._id.toString(),
        ...friendIds.map(id => id.toString()),
        ...blockedIds.map(id => id.toString()),
        ...pendingIds.map(id => id.toString())
      ];
      
      const suggestions = [];
      
      const potentialUsers = await context.di.model.Users.find({
        _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).limit(limit * 3);
      
      for (const user of potentialUsers) {
        const potentialFriends = await context.di.model.Friend.find({
          $or: [
            { requester: user._id, status: 'accepted' },
            { recipient: user._id, status: 'accepted' }
          ]
        });
        
        const potentialFriendIds = potentialFriends.map(value => 
          value.requester.toString() === user._id.toString() 
            ? value.recipient.toString() 
            : value.requester.toString()
        );
        
        const mutualFriendIds = friendIds.filter(id => 
          potentialFriendIds.includes(id.toString())
        );
        
        const mutualFriendsList = await context.di.model.Users.find({
          _id: { $in: mutualFriendIds }
        }).limit(5);
        
        suggestions.push({
          user: user,
          mutualFriends: mutualFriendIds.length,
          mutualFriendsList
        });
      }
      
      suggestions.sort((a, b) => b.mutualFriends - a.mutualFriends);
      
      return suggestions.slice(0, limit);
    },
    friendshipStatus: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      return context.di.model.Friends.findOne({
        $or: [
          { requester: user._id, recipient: userId },
          { requester: userId, recipient: user._id }
        ]
      }).populate('requester recipient');
    }
  },

  Mutation: {
    addFriend: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      if (user._id.toString() === userId) {
        throw new UserInputError('You cannot send a friend request to yourself');
      }

      const recipient = await context.di.model.Users.findById(userId);
      if (!recipient) {
        throw new UserInputError('User not found');
      }

      const existingFriend = await context.di.model.Friends.findOne({
        $or: [
          { requester: user._id, recipient: userId },
          { requester: userId, recipient: user._id }
        ]
      });

      if (existingFriend) {
        if (existingFriend.status === 'blocked') {
          throw new UserInputError('Cannot send friend request');
        }
        if (existingFriend.status === 'accepted') {
          throw new UserInputError('You are already friends with this user');
        }
        if (existingFriend.status === 'pending' && existingFriend.requester.toString() === user._id.toString()) {
          throw new UserInputError('Friend request already sent');
        }
        if (existingFriend.status === 'pending' && existingFriend.recipient.toString() === user._id.toString()) {
          existingFriend.status = 'accepted';
          await existingFriend.save();
          return existingFriend.populate('requester recipient');
        }
        if (existingFriend.status === 'rejected') {
          existingFriend.status = 'pending';
          existingFriend.requester = user._id;
          existingFriend.recipient = userId;
          await existingFriend.save();
          return existingFriend.populate('requester recipient');
        }
      }

      await new context.di.model.Friends({
        requester: user._id,
        recipient: userId,
        status: 'pending'
      }).save();

      await createFriendRequestNotification(
        userId,
        user._id
      );

      return true;
    },

    acceptFriendRequest: async (parent, { requestId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      const friendship = await context.di.model.Friends.findById(requestId);
      if (!friendship) {
        throw new UserInputError('Friend request not found');
      }

      friendship.status = 'accepted';
      await friendship.save();
      await createFriendAcceptNotification(
        friendship.requester,
        user._id
      );
      return friendship.populate('requester recipient');
    },
    
    rejectFriendRequest: async (parent, { requestId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      const friendship = await context.di.model.Friends.findById(requestId);
      if (!friendship) {
        throw new UserInputError('Friend request not found');
      }

      if (friendship.recipient.toString() !== user._id.toString()) {
        throw new UserInputError('You cannot reject this friend request');
      }

      if (friendship.status !== 'pending') {
        throw new UserInputError('This friend request is not pending');
      }

      friendship.status = 'rejected';
      await friendship.save();
      return friendship.populate('requester recipient');
    },
    unfriend: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      const result = await context.di.model.Friends.deleteOne({
        $or: [
          { requester: user._id, recipient: userId, status: 'accepted' },
          { requester: userId, recipient: user._id, status: 'accepted' }
        ]
      });

      return result;
    },
    blockUser: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      if (user._id.toString() === userId) {
        throw new UserInputError('You cannot block yourself');
      }

      const blockedUser = await context.di.model.Users.findById(userId);
      if (!blockedUser) {
        throw new UserInputError('User not found');
      }

      let friendship = await context.di.model.Friends.findOne({
        $or: [
          { requester: user._id, recipient: userId },
          { requester: userId, recipient: user._id }
        ]
      });

      if (friendship) {
        friendship.status = 'blocked';
        friendship.requester = user._id;
        friendship.recipient = userId;
      } else {
        friendship = new context.di.model.Friends({
          requester: user._id,
          recipient: userId,
          status: 'blocked'
        });
      }

      await friendship.save();
      return friendship.populate('requester recipient');
    },
    unblockUser: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);

      const result = await context.di.model.Friends.deleteOne({
        requester: user._id,
        recipient: userId,
        status: 'blocked'
      });

      return result.deletedCount > 0;
    }
  },

  User: {
    friendsCount: async (user, args, context) => {
      return context.di.model.Friends.countDocuments({
        $or: [{ requester: user._id }, { recipient: user._id }]
      });
    }
  }
};