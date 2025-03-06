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
        viewCount: Int
        type: String
        mentions: [User]
        privacy: String
        audio: Audio
        duration: Int
        expiresAt: String
        storyViews: [User]
	}

    type Audio {
        name: String
        artist: String
        url: String
    }

    extend type Post {
        likeCount: Int
        saveCount: Int
    }

    input AddPostInput {
        caption: String
        mediaUrls: [String]!
        type: String
        location: String
        tags: [String]
        mentions: [String]
        privacy: String
        audio: AudioInput
        duration: Int
    }

	input EditPostInput {
		_id: String
		caption: String
        tags: [String]
        location: String
        mediaUrls: String
        audio: AudioInput
        duration: Int
	}

    input AudioInput {
        name: String
        artist: String
        url: String
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