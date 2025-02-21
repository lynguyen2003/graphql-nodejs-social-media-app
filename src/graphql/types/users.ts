import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type User {
		_id: String
		uuid: String
		email: String
		password: String
		username: String
		phone:String
		bio: String
		imageUrl: String
		isAdmin: Boolean
		isActive: Boolean
		otpSecret: String
		registrationDate: String
		lastLogin: String
	}

	input UpdateUserInput {
		_id: String
		email: String
		username: String
		phone:String
		bio: String
		imageUrl: String
		isAdmin: Boolean
		isActive: Boolean
	}

	type Query {
		""" Get list of all users registered on database """
		listAllUsers: [User]
	}
	type Mutation {
		updateUser(input: UpdateUserInput!): User!
		addPhoneNumber(phone: String!): User!
	}
`;