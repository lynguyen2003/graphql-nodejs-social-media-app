import merge from 'lodash.merge';

import user from './user.js';
import auth from './auth.js';
import post from './post.js';

export const resolvers = merge(
	user,
	post,
	auth
);
