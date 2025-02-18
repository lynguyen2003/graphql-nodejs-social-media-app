import merge from 'lodash.merge';

import users from './user.js';
import auth from './auth.js';

export const resolvers = merge(
	users,
	auth
);
