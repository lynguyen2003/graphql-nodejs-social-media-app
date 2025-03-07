import merge from 'lodash.merge';

import user from './user.js';
import auth from './auth.js';
import post from './post.js';
import friend from './friend.js';
import follow from './follow.js';
import comment from './comment.js';
import notification from './notification.js';

export const resolvers = merge(
	user,
	post,
	auth,
	friend,
	follow,
	comment,
	notification
);
