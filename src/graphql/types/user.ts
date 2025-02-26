import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type User {
		_id: String
		email: String
		password: String
		username: String
		phone:String
		bio: String
		posts: [Post]
		friendsCount: Int
		imageUrl: String
		isAdmin: Boolean
		isActive: Boolean
		otpSecret: String
		registrationDate: String
		lastLogin: String
	}

	input UpdateUserInput {
		email: String
		username: String
		phone:String
		bio: String
		imageUrl: String
		isAdmin: Boolean
		isActive: Boolean
	}

	type Query {
		users: [User]
		user(id: String!): User
	}
	type Mutation {
		updateUser(input: UpdateUserInput!): User!
		addPhoneNumber(phone: String!): User!
	}
`;