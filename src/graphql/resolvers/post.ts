import { UserInputError } from "apollo-server-express"

type PostInput = {
	id: String
	caption: String
	tags: String[]
	location: String
	mediaUrls: String[]
	isArchived: Boolean
}

export default {
	Query: {
		posts:  async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			context.di.authValidation.ensureThatUserIsAdministrator(context);

			const sortCriteria = { isAdmin: 'desc', registrationDate: 'asc' };
			return context.di.model.Posts.find().sort(sortCriteria).populate('author').lean();
		},
        post: async (parent, { id } , context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			if (!id) {
				throw new UserInputError('ID is required');
			}
			return await context.di.model.Posts.findById(id)
				.populate('author')
				.lean();
		}
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

			const post = await new context.di.model.Posts({
				author: user._id,
				caption: input.caption,
				tags: input.tags,
				location: input.location,
				mediaUrls: input.mediaUrls,
				isArchived: input.isArchived,
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

			await context.di.model.Users.findOneAndUpdate(
				{ _id: user._id },
				{ $pull: { posts: id } },
				{ new: true }
			).lean();

			return context.di.model.Posts.findOneAndDelete({ _id: id });
		},
		toggleLikePost: async (parent, { id }, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);
			const user = await context.di.authValidation.getUser(context);
			
			const post = await context.di.model.Posts.findById(id);
			if (!post) {
				throw new UserInputError('Post not found');
			}
			
			const userIdStr = user._id.toString();
			const userLikedIndex = post.likes.findIndex(id => id.toString() === userIdStr);
			
			if (userLikedIndex === -1) {
				post.likes.push(user._id);
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
			const userSavedIndex = post.savedBy.findIndex(id => id.toString() === userIdStr);

			if (userSavedIndex === -1) {
				post.savedBy.push(user._id);
			} else {
				post.savedBy.splice(userSavedIndex, 1);
			}

			await post.save();
			return post.populate('author savedBy');
		}

	}
};
