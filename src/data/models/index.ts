import mongoose from 'mongoose';

import { UsersSchema, PostsSchema, FriendsSchema, FollowersSchema } from './schemas';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Posts: mongoose.model('posts', PostsSchema),
	Friends: mongoose.model('friends', FriendsSchema),
	Followers: mongoose.model('followers', FollowersSchema),
};
