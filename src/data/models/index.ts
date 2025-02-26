import mongoose from 'mongoose';

import { UsersSchema, PostsSchema, FriendsSchema } from './schemas';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Posts: mongoose.model('posts', PostsSchema),
	Friends: mongoose.model('friends', FriendsSchema),
};
