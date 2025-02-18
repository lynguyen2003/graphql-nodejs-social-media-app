import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-express';
import { models } from '../../data/models';

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

	ensureThatUserIsAdministrator: (context) => {
		if (!context.user || !context.user.isAdmin) {
			throw new ForbiddenError('You must be an administrator to perform this action');
		}
	},

	getUser: async (context) => {
		if (!context.user) {
			return null;
		}
	
		const userUUID = context.user.uuid || null;
		const user = await models.Users.findOne({ uuid: userUUID }).lean();
		if (!user) {
			throw new AuthenticationError('You must be logged in to perform this action');
		}

		return user;
	},
};