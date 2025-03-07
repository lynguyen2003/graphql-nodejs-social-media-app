import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const NotificationsSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['like_post', 'comment_post', 'reply_comment', 'follow', 'friend_request', 'friend_accept', 'mention', 'system'],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        refPath: 'entityType',
        required: true
    },
    entityType: {
        type: String,
        enum: ['posts', 'comments', 'users'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

NotificationsSchema.index({ recipient: 1, createdAt: -1 });
NotificationsSchema.index({ recipient: 1, isRead: 1 });
NotificationsSchema.index({ entityId: 1, type: 1 });

export { NotificationsSchema }; 