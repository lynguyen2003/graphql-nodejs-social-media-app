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
        trim: true,
        default: []
    }],
    mentions: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: []
    }],
    privacy: {
        type: String,
        enum: ['public', 'private', 'followers', 'friends'],
        default: 'public'
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    type: {
        type: String,
        enum: ['post', 'reel', 'story'],
        default: 'post'
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
        ref: 'users',
        default: []
    }],
    saves: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: []
    }],
    audio: {
        name: {
            type: String,
            default: ''
        },
        artist: {
            type: String,
            default: ''
        },
        url: {
            type: String,
            default: ''
        }
    },
    duration: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        default: null
    },
    storyViews: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
}, {
    timestamps: true
});

PostsSchema.index({ userId: 1, createdAt: -1 });
PostsSchema.index({ author: 1, createdAt: -1 });
PostsSchema.index({ tags: 1 });
PostsSchema.index({ type: 1 });

export { PostsSchema };
