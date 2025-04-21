import { UserInputError } from "apollo-server-express";
import mongoose from 'mongoose';
import { 
    createCommentPostNotification,
    createReplyCommentNotification,
    createMentionNotification,
    EntityType
} from '../../services/notificationService.js';

type CommentInput = {
    _id: string;
    postId: string;
    content: string;
    parentCommentId?: string;
    mentions?: string[];
}

export default {
    Query: {
        comments: async (parent, { postId, parentCommentId }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);

            const query = { 
                post: postId,
                parentComment: parentCommentId || null
            };

            return await context.di.model.Comments.find(query)
                .sort({ createdAt: -1 })
                .populate('author')
                .populate('mentions')
                .lean();
        },
        comment: async (parent, { id }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);

            const comment = await context.di.model.Comments.findById(id)
                .populate('author')
                .populate('mentions')
                .lean();

            if (!comment) {
                throw new UserInputError('Comment not found');
            }

            return comment;
        }
    },
    Mutation: {
        addComment: async (parent, { input }: { input: CommentInput }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            context.di.authValidation.ensureThatUserIsActived(context);

            const user = await context.di.authValidation.getUser(context);
            const post = await context.di.model.Posts.findById(input.postId);
            if (!post) {
                throw new UserInputError('Post not found');
            }

            let parentComment = null;
            if (input.parentCommentId) {
                parentComment = await context.di.model.Comments.findById(input.parentCommentId);
                if (!parentComment) {
                    throw new UserInputError('Parent comment not found');
                }
            }
            const mentions = input.mentions ? input.mentions.map(mention => mention) : [];
            const comment = await new context.di.model.Comments({
                post: input.postId,
                author: user._id,
                content: input.content,
                parentComment: input.parentCommentId || null,
                mentions: mentions
            }).save();

            await context.di.model.Posts.findByIdAndUpdate(
                input.postId,
                { $inc: { commentCount: 1 } }
            );

            if (!parentComment) {
                if (post.author.toString() !== user._id.toString()) {
                    await createCommentPostNotification(
                        new mongoose.Types.ObjectId(input.postId),
                        post.author,
                        user._id,
                        input.content
                    );
                }
            } else {
                if (parentComment.author.toString() !== user._id.toString()) {
                    await createReplyCommentNotification(
                        new mongoose.Types.ObjectId(parentComment._id),
                        parentComment.author,
                        user._id,
                        input.content,
                        new mongoose.Types.ObjectId(input.postId)
                    );
                }
            }

            if (mentions && mentions.length > 0) {
                for (const mentionId of mentions) {
                    if (mentionId.toString() !== user._id.toString()) {
                        await createMentionNotification(
                            new mongoose.Types.ObjectId(mentionId),
                            user._id,
                            comment._id,
                            EntityType.COMMENT,
                            input.content
                        );
                    }
                }
            }

            return await context.di.model.Comments.findById(comment._id)
                .populate('author')
                .populate('mentions')
                .lean();
        },
        editComment: async (parent, { input }: { input: CommentInput }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);

            const user = await context.di.authValidation.getUser(context);

            if (!input.content || input.content.trim() === '') {
                throw new UserInputError('Comment content is required');
            }

            const comment = await context.di.model.Comments.findById(input._id);
            if (!comment) {
                throw new UserInputError('Comment not found');
            }

            if (comment.author.toString() !== user._id.toString()) {
                throw new UserInputError('You do not have permission to edit this comment');
            }

            const updateData = {
                content: input.content,
                mentions: input.mentions || comment.mentions
            };

            const updatedComment = await context.di.model.Comments.findByIdAndUpdate(
                input._id,
                { $set: updateData },
                { new: true }
            )
            .populate('author')
            .populate('mentions')
            .lean();

            return updatedComment;
        },
        deleteComment: async (parent, { id }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            const comment = await context.di.model.Comments.findById(id);
            if (!comment) {
                throw new UserInputError('Comment not found');
            }

            if (comment.author.toString() !== user._id.toString()) {
                throw new UserInputError('You do not have permission to delete this comment');
            }

            await context.di.model.Comments.deleteMany({ parentComment: id });

            const deletedComment = await context.di.model.Comments.findByIdAndDelete(
                id
            );

            return deletedComment;
        },
        toggleLikeComment: async (parent, { id }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);
            
            const comment = await context.di.model.Comments.findById(id);
            if (!comment) {
                throw new UserInputError('Comment not found');
            }
            
            const userIdStr = user._id.toString();
            const userLikedIndex = comment.likes.findIndex(id => id.toString() === userIdStr);
            
            if (userLikedIndex === -1) {
                comment.likes.push(user._id);
            } else {
                comment.likes.splice(userLikedIndex, 1);
            }
            
            await comment.save();
            return await context.di.model.Comments.findById(comment._id)
                .populate('author')
                .populate('likes')
                .populate('mentions')
                .lean();
        }
    },
    Comment: {
        likeCount: async (parent) => { 
            return parent.likes ? parent.likes.length : 0; 
        },
        replies: async (parent, args, context) => {
            return await context.di.model.Comments.find({ 
                parentComment: parent._id,
            })
            .sort({ createdAt: -1 })
            .populate('author')
            .populate('mentions')
            .lean();
        }
    }
}