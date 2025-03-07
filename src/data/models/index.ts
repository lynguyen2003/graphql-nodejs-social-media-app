import mongoose from 'mongoose';

import { 
	UsersSchema, 
	PostsSchema, 
	FriendsSchema, 
	FollowersSchema, 
	RefreshTokensSchema, 
	CommentsSchema, 
	NotificationsSchema 
} from './schemas';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Posts: mongoose.model('posts', PostsSchema),
	Friends: mongoose.model('friends', FriendsSchema),
	Followers: mongoose.model('followers', FollowersSchema),
	RefreshTokens: mongoose.model('refreshTokens', RefreshTokensSchema),
	Comments: mongoose.model('comments', CommentsSchema),
	Notifications: mongoose.model('notifications', NotificationsSchema),
};
