import mongoose from 'mongoose';

import { UsersSchema } from './schemas';

export const models = {
	Users: mongoose.model('users', UsersSchema),
};
