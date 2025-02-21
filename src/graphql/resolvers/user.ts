import { UserInputError } from "apollo-server-express";
import { otpHelper } from "../../helpers/otpHelper";
import { formatPhoneNumber } from "../../helpers/validations";
import { sendOTPViaSMS } from "../../services/sms/stringeeService";

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
		addPhoneNumber: async (parent, { phone }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);
	  
			const formattedPhone = formatPhoneNumber(phone);
			if (!formattedPhone) {
			  throw new UserInputError('Invalid phone number format. Please use format: +84912345678');
			}
	  
			const existingUser = await context.di.model.Users.findOne({ phone: formattedPhone });
			if (existingUser) {
			  throw new UserInputError('Phone number is already in use');
			}
	  
			await context.di.model.Users.updateOne(
			  { uuid: user.uuid },
			  { 
				phone: formattedPhone,
				isPhoneVerified: false 
			  }
			);
	  
			const otp = otpHelper.generateToken(user.otpSecret);
			await sendOTPViaSMS(phone, otp);
			return true;
		},
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
