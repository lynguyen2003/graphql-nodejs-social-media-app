import mongoose, { Schema } from 'mongoose';

const SavedSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'posts',
        required: true
    },
}, {
    timestamps: true
});

SavedSchema.index({ userId: 1, createdAt: -1 });
SavedSchema.index({ userId: 1, postId: 1 }, { unique: true });

export { SavedSchema }; 