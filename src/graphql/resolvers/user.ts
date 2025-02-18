import { UserInputError } from "apollo-server-express";

/**
 * All resolvers related to users
 * @typedef {Object}
 */

type UpdateUserInput = {
	_id: String
	email: String
	username: String
	bio: String
	imageUrl: String
}

export default {
	Query: {
		listAllUsers:  async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			context.di.authValidation.ensureThatUserIsAdministrator(context);

			const sortCriteria = { isAdmin: 'desc', registrationDate: 'asc' };
			return context.di.model.Users.find().sort(sortCriteria).lean();
		}
	},
	Mutation: {
		updateUser: async (parent, { input } : {input: UpdateUserInput} , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			if (!input) throw new UserInputError('Data provided is not valid');
			if (!input._id) throw new UserInputError('User ID is required');

			const updateData = Object.entries(input)
				.filter(([key, value]) => value != null && key !== '_id')
				.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

			const userObj = await context.di.model.Users.findByIdAndUpdate(
				input._id,
				{ $set: updateData },
				{ new: true }
			).lean();

			if (!userObj) {
				throw new UserInputError('User not found');
			}
			return userObj;
		}
	}
};
