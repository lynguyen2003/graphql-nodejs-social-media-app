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
		users:  async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			context.di.authValidation.ensureThatUserIsAdministrator(context);

			const sortCriteria = { isAdmin: 'desc', registrationDate: 'asc' };
			const users = context.di.model.Users.find().sort(sortCriteria).populate('posts').lean();
			return users
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
