import { UserInputError } from 'apollo-server-express';
import bcrypt from 'bcrypt';

import { isValidEmail, isStrongPassword } from '../../helpers/validations.js';
import { sendOTPEmail } from '../../services/email/emailService.js';
import { otpHelper } from '../../helpers/otpHelper.js';
import { sendOTPViaSMS } from '../../services/sms/twilioService.js';

interface AuthPayload {
	token: string;
}

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

			const otpSecret = otpHelper.generateSecret();
			const otpCode = otpHelper.generateToken(otpSecret);

			await new context.di.model.Users({ email, password, otpSecret }).save?.();
			const user = await context.di.model.Users.findOne({ email }).lean();

			await sendOTPEmail(user.email, otpCode)		
			
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

		sendOTPToEmail: async (parent, { email }, context) => {
			const user = await context.di.model.Users.findOne({ email }).lean();
			if (!user) {
				throw new UserInputError('User not found');
			}
			const otpCode = otpHelper.generateToken(user.otpSecret);
			try {
				await sendOTPEmail(user.email, otpCode)
			} catch (error) {
				throw new Error(`Failed to send OTP: ${error.message}`);
			} 
			return 'OTP sent successfully';
		},

		sendOTPToSMS: async (parent, { phone }, context) => {
			if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
				throw new UserInputError('Invalid phone number.');
			}
			const user = await context.di.model.Users.findOne({ phone }).lean();
			if (!user) {
				throw new UserInputError('User not found');
			}
			const otp = otpHelper.generateToken(user.otpSecret);
			try {
				await sendOTPViaSMS(phone, otp);
				return 'OTP sent successfully';
			} catch (error) {
				throw new Error(`Failed to send OTP: ${error.message}`);
			}
		},

		verifyOTP: async (parent, { email, token }, context) => {
			const user = await context.di.model.Users.findOne({ email }).lean();
			if (!user) {
			  throw new UserInputError('User not found');
			}
			
			const isValid = otpHelper.verifyToken(token, user.otpSecret);
			console.log(token)
			if (!isValid) {
			  throw new UserInputError('Invalid OTP');
			}


			await context.di.model.Users.updateOne(
				{ id: user.uuid },
				{ isActive: true }
			  );
	  
			return {
			  token: context.di.jwt.createAuthToken(user.email, user.isAdmin, true, user.uuid)
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
