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
		imageUrl: String
		isAdmin: Boolean
		isActive: Boolean
		isPhoneVerified: Boolean
		otpSecret: String
		registrationDate: String
		lastLogin: String
	}

	type UserEdge {
        node: User!
    }

    type UserConnection {
        edges: [UserEdge!]!
        pageInfo: PageInfo!
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
		users(cursor: String, limit: Int): UserConnection!
		user(id: String!): User
	}
	type Mutation {
		updateUser(input: UpdateUserInput!): User!
		addPhoneNumber(phone: String!): User!
	}
`;