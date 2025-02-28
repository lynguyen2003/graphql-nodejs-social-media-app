import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
    type Post {
        _id: String
		author: User!
        caption: String
        tags: [String]
        location: String
        mediaUrls: [String]
        likes: [User]
        saved: [User]
	}

    input AddPostInput {
        caption: String
        tags: [String]
        location: String
        mediaUrls: [String]!
    }

	input EditPostInput {
		_id: String
		caption: String
        tags: [String]
        location: String
        mediaUrls: String
	}

	type Query {
		posts: [Post]
        post(id: String!): Post
	}
    type Mutation {
        addPost(input: AddPostInput!): Post!
        editPost(input: EditPostInput!): Post!
        deletePost(id: String!): Post
        toggleLikePost(id: String!): Post!
        toggleSavePost(id: String!): Post!
    }
`;