import mongoose from 'mongoose';

import { 
	UsersSchema, 
	PostsSchema, 
	FriendsSchema, 
	FollowersSchema, 
	RefreshTokensSchema, 
	CommentsSchema, 
	NotificationsSchema,
	MessageSchema,
	ConversationSchema
} from './schemas/index.js';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Posts: mongoose.model('posts', PostsSchema),
	Friends: mongoose.model('friends', FriendsSchema),
	Followers: mongoose.model('followers', FollowersSchema),
	RefreshTokens: mongoose.model('refreshTokens', RefreshTokensSchema),
	Comments: mongoose.model('comments', CommentsSchema),
	Notifications: mongoose.model('notifications', NotificationsSchema),
	Messages: mongoose.model('messages', MessageSchema),
	Conversations: mongoose.model('conversations', ConversationSchema)
};
