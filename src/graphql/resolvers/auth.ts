import { UserInputError } from 'apollo-server-express';
import bcrypt from 'bcrypt';

import { isValidEmail, isStrongPassword } from '../../helpers/validations.js';

interface AuthPayload {
	token: string;
}

/**
 * All resolvers related to auth
 */
const authResolvers = {
	Query: {},
	Mutation: {
		registerUser: async ( parent, { email, password }, context ): Promise<AuthPayload> => {
			if (!email || !password) {
				throw new UserInputError('Data provided is not valid');
			}

			if (!isValidEmail(email)) {
				throw new UserInputError('The email is not valid');
			}

			if (!isStrongPassword(password)) {
				throw new UserInputError('The password is not secure enough');
			}

			const isAnEmailAlreadyRegistered = await context.di.model.Users.findOne({ email }).lean();
			if (isAnEmailAlreadyRegistered) {
				throw new UserInputError('Data provided is not valid');
			}

			await new context.di.model.Users({ email, password }).save?.();
			const user = await context.di.model.Users.findOne({ email }).lean();

			return {
				token: context.di.jwt.createAuthToken(user.email, user.isAdmin, user.isActive, user.uuid),
			};
		},

		authUser: async ( parent, { email, password }, context ): Promise<AuthPayload> => {
			if (!email || !password) {
				throw new UserInputError('Invalid credentials');
			}

			console.log(email)

			const user = await context.di.model.Users.findOne({ email }).lean();
			if (!user) {
				throw new UserInputError('User not found or login not allowed');
			}

			const isCorrectPassword = await bcrypt.compare(password, user.password);
			if (!isCorrectPassword) {
				throw new UserInputError('Invalid credentials');
			}

			await context.di.model.Users.findOneAndUpdate(
				{ email },
				{ lastLogin: new Date().toISOString() },
				{ new: true }
			).lean();

			return {
				token: context.di.jwt.createAuthToken(user.email, user.isAdmin, user.isActive, user.uuid),
			};
		},
		
		deleteMyUserAccount: async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const user = await context.di.authValidation.getUser(context);
			
			return context.di.model.Users.deleteOne({ uuid: user.uuid });
		},
	},
};

export default authResolvers;
