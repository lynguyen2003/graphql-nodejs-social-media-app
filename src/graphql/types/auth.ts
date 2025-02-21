import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type Token {
		token: String
	}

	type TOTPSetup {
		secret: String!
		qrCodeUrl: String!
	}

	type Mutation {
		registerUser(email: String!, password: String!): Token
		authUser(email: String!, password: String!): Token
		deleteMyUserAccount: DeleteResult
		verifyOTP(email: String!, token: String!): Token!
		sendOTPToEmail(email: String!): String
		sendOTPToSMS(phone: String!): String
	}
`;