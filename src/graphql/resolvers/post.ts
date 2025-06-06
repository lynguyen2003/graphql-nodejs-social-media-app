import { UserInputError } from "apollo-server-express"
import { getViewCount, incrementView } from "../../config/redisDb.js"
import { createLikePostNotification } from "../../services/notificationService.js";

type PostInput = {
	id: String
	caption: String
	tags: String[]
	location: String
	mediaUrls: String[]
	type: String
	mentions: String[]
	privacy: String
}

export default {
	Query: {
		posts: async (parent, { cursor, limit }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			
			const query: any = {};
			if (cursor) {
				query._id = { $lt: cursor };
			}
			
			const posts = await context.di.model.Posts.find(query)
				.sort({ createdAt: -1 })
				.limit(limit + 1)
				.populate('author')
				.populate('mentions')
				.lean();
			
			const hasNextPage = posts.length > limit;
			const edges = hasNextPage ? posts.slice(0, limit) : posts;
			
			const endCursor = edges.length > 0 ? edges[edges.length - 1]._id : null;
			
			return {
				edges: edges.map(post => ({ node: post })),
				pageInfo: {
					endCursor,
					hasNextPage
				}
			};
		},
		post: async (parent, { id } , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			await incrementView(id);
			const result = await context.di.model.Posts.findById(id).populate('author').populate('mentions').lean();
			result.viewCount = await getViewCount(id);

			if (!result) {
				throw new UserInputError('Post not found');
			}

			return result;
		},
		relatedPosts: async (parent, { id } , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const result = await context.di.model.Posts.find({ tags: { $in: parent.tags }, author: { $ne: parent.author } }).populate('author').lean();

			return result;
		},
		likedPosts: async (parent, { userId } , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const result = await context.di.model.Posts.find({ likes: userId }).populate('author').lean();

			return result;
		},
		searchPosts: async (parent, { searchQuery }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			
			// Search in captions, tags and locations
			const result = await context.di.model.Posts.find({
				$or: [
					{ caption: { $regex: searchQuery, $options: 'i' } },
					{ tags: { $in: [new RegExp(searchQuery, 'i')] } },
					{ location: { $regex: searchQuery, $options: 'i' } }
				]
			})
			.sort({ createdAt: -1 })
			.populate('author')
			.populate('mentions')
			.lean();
			
			return result;
		},
	},
	Mutation: {
		addPost: async (parent, { input } : { input: PostInput }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			context.di.authValidation.ensureThatUserIsActived(context);

			const user = await context.di.authValidation.getUser(context);

			if (!input) throw new UserInputError('Data provided is not valid');
			if (!input.mediaUrls || input.mediaUrls.length === 0) {
				throw new UserInputError('At least one media URL is required');
			}

			if (input.type === 'story' && !input.location) {
				throw new UserInputError('Location is required for story posts');
			}

			const postType = input.type || 'post';
			const expiresAt = postType === 'story' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

			const post = await new context.di.model.Posts({
				...input,
				author: user._id,
				mentions: input.mentions.map(mention => new context.di.model.Users({ _id: mention })),
				type: postType,
				expiresAt
			}).save();

			await context.di.model.Users.findByIdAndUpdate(
				user._id,
				{ $push: { posts: post._id } },
				{ new: true }
			).lean();

			return post;
		},
		editPost: async (parent, { input } : { input: PostInput }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			context.di.authValidation.ensureThatUserIsActived(context);

			if (!input) throw new UserInputError('Data provided is not valid');

			return await context.di.model.Posts.findByIdAndUpdate(
				input.id,
				{ $set: input },
				{ new: true }
			).lean();
		},
		deletePost: async (parent, { id }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);

			const post = await context.di.model.Posts.findById(id);
			
			if (!post) {
				throw new UserInputError('Post not found');
			}
			
			if (post.author.toString() !== user._id.toString() && !user.isAdmin) {
				throw new UserInputError('You do not have permission to delete this post');
			}

			await context.di.model.Users.findOneAndUpdate(
				{ _id: post.author },
				{ $pull: { posts: id } },
				{ new: true }
			).lean();

			await context.di.model.Comments.deleteMany(
                { post: id }
            );

			await context.di.model.Posts.findByIdAndDelete(id);
			return true;
		},
		toggleLikePost: async (parent, { id }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);
			
			const post = await context.di.model.Posts.findById(id);
			if (!post) {
				throw new UserInputError('Post not found');
			}
			
			const userId = user._id.toString();
			const userLikedIndex = post.likes.findIndex(id => id.toString() === userId);
			
			if (userLikedIndex === -1) {
				post.likes.push(user._id);
				
				await createLikePostNotification(
					id,
					post.author,
					user._id
				);
			} else {
				post.likes.splice(userLikedIndex, 1);
			}
			
			await post.save();
			return post.populate('author likes');
		},
		toggleSavePost: async (parent, { id }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);

			const post = await context.di.model.Posts.findById(id);
			if (!post) {
				throw new UserInputError('Post not found');
			}

			const userIdStr = user._id.toString();
			const userSavedIndex = post.saves.findIndex(id => id.toString() === userIdStr);

			if (userSavedIndex === -1) {
				post.saves.push(user._id);
			} else {
				post.saves.splice(userSavedIndex, 1);
			}

			await post.save();
			return post.populate('author saves');
		}
	},
	Post: {
		likeCount: async (parent) => { return parent.likes.length; },
		saveCount: async (parent) => { return parent.saves.length; },
        commentCount: async (parent, args, context) => {
            return await context.di.model.Comments.countDocuments({
                post: parent._id
            });
        },
		comments: async (parent, args, context) => {
			return await context.di.model.Comments.find({ 
				post: parent._id,
				parentComment: null,
			})
			.sort({ createdAt: -1 })
			.limit(5)
			.populate('author')
			.populate('mentions')
			.lean();
		}
	}
};