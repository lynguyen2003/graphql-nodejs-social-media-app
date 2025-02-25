import mongoose from 'mongoose';

import { UsersSchema, PostsSchema } from './schemas';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Posts: mongoose.model('posts', PostsSchema),
};
