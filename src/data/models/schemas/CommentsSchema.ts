import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CommentsSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: "posts",
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: "comments",
        default: null,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "users",
    }],
    mentions: [{
        type: Schema.Types.ObjectId,
        ref: "users",
    }],
}, { timestamps: true });

CommentsSchema.index({ post: 1, createdAt: -1 });
CommentsSchema.index({ author: 1 });
CommentsSchema.index({ parentComment: 1 });

export { CommentsSchema };
