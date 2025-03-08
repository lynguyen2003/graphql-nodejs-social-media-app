import { UserInputError } from "apollo-server-express";
import { createFollowNotification } from "../../services/notificationService.js";

export default {
  Query: {
    followers: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const currentUser = await context.di.authValidation.getUser(context);
      
      const targetUserId = userId || currentUser._id;
      
      const followers = await context.di.model.Followers.find({
        following: targetUserId
      }).populate('follower');
      
      return followers.map(f => f.follower);
    },
    
    following: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const currentUser = await context.di.authValidation.getUser(context);
      
      const targetUserId = userId || currentUser._id;
      
      const following = await context.di.model.Followers.find({
        follower: targetUserId
      }).populate('following');
      
      return following.map(f => f.following);
    },
    
    isFollowing: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      const follow = await context.di.model.Followers.findOne({
        follower: user._id,
        following: userId
      });
      
      return !!follow;
    }
  },
  
  Mutation: {
    follow: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      if (user._id.toString() === userId) {
        throw new UserInputError('You cannot follow yourself');
      }
      
      const targetUser = await context.di.model.Users.findById(userId);
      if (!targetUser) {
        throw new UserInputError('User not found');
      }
      
      const existingFollow = await context.di.model.Followers.findOne({
        follower: user._id,
        following: userId
      });
      
      if (existingFollow) {
        throw new UserInputError('You are already following this user');
      }
      
      await context.di.model.Followers.create({
        follower: user._id,
        following: userId
      });

      await createFollowNotification(
        userId,
        user._id
      );
      
      return true;
    },
    
    unfollow: async (parent, { userId }, context) => {
      context.di.authValidation.ensureThatUserIsLogged(context);
      const user = await context.di.authValidation.getUser(context);
      
      const result = await context.di.model.Followers.deleteOne({
        follower: user._id,
        following: userId
      });
      
      return result.deletedCount > 0;
    }
  },
  
  User: {
    followersCount: async (user, args, context) => {
      return context.di.model.Followers.countDocuments({
        following: user._id
      });
    },
    
    followingCount: async (user, args, context) => {
      return context.di.model.Followers.countDocuments({
        follower: user._id
      });
    }
  }
};