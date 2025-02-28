import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PostsSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref:'users',
        required: true
    },
    caption: {
        type: String,
        trim: true,
        default: ''
    },
    tags: [{
        type: String,
        trim: true
    }],
    location: {
        type: String,
        trim: true,
        default: ''
    },
    mediaUrls: [{
        type: String,
        required: true
    }],
    viewCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    saves: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
}, {
    timestamps: true
});

// Indexes for better query performance
PostsSchema.index({ userId: 1, createdAt: -1 });
PostsSchema.index({ tags: 1 });

export { PostsSchema };
