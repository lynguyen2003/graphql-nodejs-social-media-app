import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { models } from '../../data/models/index.js';

/**
 * Auth validations repository
 * @typedef {Object}
 */
export const authValidations = {
	ensureThatUserIsLogged: (context) => {
		if (!context.user) {
			throw new AuthenticationError('You must be logged in to perform this action');
		}
	},

	ensureThatUserIsActived: (context) => {
		if (!context.user || !context.user.isActive) {
			throw new AuthenticationError('You must be active to perform this action');
		}
	},
	
	ensureThatUserIsAdministrator: (context) => {
		if (!context.user || !context.user.isAdmin) {
			throw new ForbiddenError('You must be an administrator to perform this action');
		}
	},

	getUser: async (context) => {
		if (!context.user) {
			return null;
		}
	
		const id = context.user._id;
		const user = await models.Users.findOne({ _id: id }).lean();
		if (!user) {
			throw new AuthenticationError('You must be logged in to perform this action...');
		}

		return user;
	},
};