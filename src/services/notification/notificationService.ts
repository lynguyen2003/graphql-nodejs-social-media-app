import mongoose from 'mongoose';
import { models } from '../../data/models/index.js';
import { sendNotificationToUser } from '../websocket/websocketService.js';

export enum NotificationType {
    LIKE_POST = 'like_post',
    COMMENT_POST = 'comment_post',
    REPLY_COMMENT = 'reply_comment',
    FOLLOW = 'follow',
    FRIEND_REQUEST = 'friend_request',
    FRIEND_ACCEPT = 'friend_accept',
    MENTION = 'mention',
    SYSTEM = 'system'
}

export enum EntityType {
    POST = 'posts',
    COMMENT = 'comments',
    USER = 'users'
}

interface NotificationData {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: NotificationType;
    entityId: mongoose.Types.ObjectId;
    entityType: EntityType;
    message: string;
    metadata?: Record<string, any>;
}

export const createNotification = async (data: NotificationData) => {
    if (data.sender.toString() === data.recipient.toString()) {
        return null;
    }

    const notification = new models.Notifications({
        ...data,
        isRead: false
    });

    const savedNotification = await notification.save();
    
    if (savedNotification) {
        const populatedNotification = await models.Notifications.findById(savedNotification._id)
            .populate('sender')
            .populate('recipient')
            .lean();
        sendNotificationToUser(data.recipient.toString(), populatedNotification);
    }

    return savedNotification;
};

export const createLikePostNotification = async (
    postId: mongoose.Types.ObjectId,
    postAuthorId: mongoose.Types.ObjectId,
    likerId: mongoose.Types.ObjectId
) => {
    return await createNotification({
        recipient: postAuthorId,
        sender: likerId,
        type: NotificationType.LIKE_POST,
        entityId: postId,
        entityType: EntityType.POST,
        message: 'liked your post'
    });
};

export const createCommentPostNotification = async (
    postId: mongoose.Types.ObjectId,
    postAuthorId: mongoose.Types.ObjectId,
    commenterId: mongoose.Types.ObjectId,
    commentContent: string
) => {
    return await createNotification({
        recipient: postAuthorId,
        sender: commenterId,
        type: NotificationType.COMMENT_POST,
        entityId: postId,
        entityType: EntityType.POST,
        message: 'commented on your post',
        metadata: {
            commentContent: commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : '')
        }
    });
};

export const createReplyCommentNotification = async (
    commentId: mongoose.Types.ObjectId,
    commentAuthorId: mongoose.Types.ObjectId,
    replierId: mongoose.Types.ObjectId,
    replyContent: string,
    postId: mongoose.Types.ObjectId
) => {
    return await createNotification({
        recipient: commentAuthorId,
        sender: replierId,
        type: NotificationType.REPLY_COMMENT,
        entityId: commentId,
        entityType: EntityType.COMMENT,
        message: 'replied to your comment',
        metadata: {
            replyContent: replyContent.substring(0, 50) + (replyContent.length > 50 ? '...' : ''),
            postId: postId
        }
    });
};

export const createFollowNotification = async (
    followedUserId: mongoose.Types.ObjectId,
    followerId: mongoose.Types.ObjectId
) => {
    return await createNotification({
        recipient: followedUserId,
        sender: followerId,
        type: NotificationType.FOLLOW,
        entityId: followerId,
        entityType: EntityType.USER,
        message: 'started following you'
    });
};

export const createFriendRequestNotification = async (
    receiverId: mongoose.Types.ObjectId,
    senderId: mongoose.Types.ObjectId
) => {
    return await createNotification({
        recipient: receiverId,
        sender: senderId,
        type: NotificationType.FRIEND_REQUEST,
        entityId: senderId,
        entityType: EntityType.USER,
        message: 'sent you a friend request'
    });
};

export const createFriendAcceptNotification = async (
    requesterId: mongoose.Types.ObjectId,
    accepterId: mongoose.Types.ObjectId
) => {
    return await createNotification({
        recipient: requesterId,
        sender: accepterId,
        type: NotificationType.FRIEND_ACCEPT,
        entityId: accepterId,
        entityType: EntityType.USER,
        message: 'accepted your friend request'
    });
};

export const createMentionNotification = async (
    mentionedUserId: mongoose.Types.ObjectId,
    mentionerId: mongoose.Types.ObjectId,
    entityId: mongoose.Types.ObjectId,
    entityType: EntityType,
    content: string
) => {
    let message = '';
    if (entityType === EntityType.POST) {
        message = 'mentioned you in a post';
    } else if (entityType === EntityType.COMMENT) {
        message = 'mentioned you in a comment';
    }

    return await createNotification({
        recipient: mentionedUserId,
        sender: mentionerId,
        type: NotificationType.MENTION,
        entityId: entityId,
        entityType: entityType,
        message: message,
        metadata: {
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        }
    });
};

export const createSystemNotification = async (
    recipientId: mongoose.Types.ObjectId,
    message: string,
    metadata?: Record<string, any>
) => {
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');

    return await createNotification({
        recipient: recipientId,
        sender: systemUserId,
        type: NotificationType.SYSTEM,
        entityId: recipientId,
        entityType: EntityType.USER,
        message: message,
        metadata: metadata
    });
};

export const markNotificationAsRead = async (notificationId: mongoose.Types.ObjectId) => {
    return await models.Notifications.findByIdAndUpdate(
        notificationId,
        { $set: { isRead: true } },
        { new: true }
    );
};

export const markAllNotificationsAsRead = async (userId: mongoose.Types.ObjectId) => {
    return await models.Notifications.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
    );
};

export const deleteNotification = async (notificationId: mongoose.Types.ObjectId) => {
    return await models.Notifications.findByIdAndDelete(notificationId);
};

export const deleteAllNotifications = async (userId: mongoose.Types.ObjectId) => {
    return await models.Notifications.deleteMany({ recipient: userId });
}; 