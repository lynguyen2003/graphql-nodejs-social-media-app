import { UserInputError } from "apollo-server-express";
import { otpHelper } from "../../helpers/otpHelper.js";
import { formatPhoneNumber } from "../../helpers/validations.js";
import { sendOTPViaSMS } from "../../services/twilioService.js";

/**
 * All resolvers related to users
 * @typedef {Object}
 */

type UpdateUserInput = {
	email: String
	username: String
	bio: String
	imageUrl: String
}

export default {
	Query: {
		users: async (parent, { cursor, limit }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const currentUser = await context.di.authValidation.getUser(context);
			
			const query: any = {
				_id: { $ne: currentUser._id }
			};
			
			if (cursor) {
				query._id = { ...query._id, $lt: cursor };
			}
			
			const users = await context.di.model.Users.find(query)
				.sort({ registrationDate: -1 })
				.limit(limit + 1)
				.populate('posts')
				.lean();
			
			const hasNextPage = users.length > limit;
			const edges = hasNextPage ? users.slice(0, limit) : users;
			
			const endCursor = edges.length > 0 ? edges[edges.length - 1]._id : null;
			
			return {
				edges: edges.map(user => ({ node: user })),
				pageInfo: {
					endCursor,
					hasNextPage
				}
			};
		},
		user: async (parent, { id }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.model.Users.findById(id).populate('posts').lean();
			return user;
		}
	},
	Mutation: {
		addPhoneNumber: async (parent, { phone }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);
	  
			const formattedPhone = formatPhoneNumber(phone);
			if (!formattedPhone) {
			  throw new UserInputError('Invalid phone number format. Please use format: +84912345678');
			}

			const isPhoneExist = await context.di.model.Users.findOne({ phone: formattedPhone }).lean();
			if (isPhoneExist) {
				throw new UserInputError('Phone number is already in use');
			}

			const userObj = await context.di.model.Users.findByIdAndUpdate(
				user._id,
				{ $set: { phone: formattedPhone, isPhoneVerified: true } },
				{ new: true }
			).lean();
	  
			const otp = otpHelper.generateToken(user.otpSecret);
			await sendOTPViaSMS(phone, otp);
			return userObj;
		},
		updateUser: async (parent, { input } : { input: UpdateUserInput } , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const user = await context.di.authValidation.getUser(context);

			if (!input) throw new UserInputError('Data provided is not valid');

			const userObj = await context.di.model.Users.findByIdAndUpdate(
				user._id,
				{ $set: input },
				{ new: true }
			).lean();

			if (!userObj) {
				throw new UserInputError('User not found');
			}
			return userObj;
		}
	}
};
