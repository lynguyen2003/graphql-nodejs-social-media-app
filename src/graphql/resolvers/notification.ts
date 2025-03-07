import { UserInputError } from "apollo-server-express";
import mongoose from 'mongoose';
import { 
    markNotificationAsRead as markAsRead,
    markAllNotificationsAsRead as markAllAsRead,
    deleteNotification as deleteNotif,
    deleteAllNotifications as deleteAllNotifs
} from '../../services/notification/notificationService.js';

export default {
    Query: {
        notifications: async (parent, { limit = 20, offset = 0 }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            return await context.di.model.Notifications.find({ recipient: user._id })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate('sender')
                .populate('recipient')
                .lean();
        },
        notificationCount: async (parent, args, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            const total = await context.di.model.Notifications.countDocuments({ 
                recipient: user._id 
            });
            
            const unread = await context.di.model.Notifications.countDocuments({ 
                recipient: user._id,
                isRead: false
            });

            return { total, unread };
        }
    },
    Mutation: {
        markNotificationAsRead: async (parent, { id }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            const notification = await context.di.model.Notifications.findById(id);
            if (!notification) {
                throw new UserInputError('Notification not found');
            }

            if (notification.recipient.toString() !== user._id.toString()) {
                throw new UserInputError('You do not have permission to mark this notification as read');
            }

            const updatedNotification = await markAsRead(new mongoose.Types.ObjectId(id));
            return updatedNotification;
        },
        markAllNotificationsAsRead: async (parent, args, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            await markAllAsRead(user._id);
            return true;
        },
        deleteNotification: async (parent, { id }, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            const notification = await context.di.model.Notifications.findById(id);
            if (!notification) {
                throw new UserInputError('Notification not found');
            }

            if (notification.recipient.toString() !== user._id.toString()) {
                throw new UserInputError('You do not have permission to delete this notification');
            }

            await deleteNotif(new mongoose.Types.ObjectId(id));
            return true;
        },
        deleteAllNotifications: async (parent, args, context) => {
            context.di.authValidation.ensureThatUserIsLogged(context);
            const user = await context.di.authValidation.getUser(context);

            await deleteAllNotifs(user._id);
            return true;
        }
    }
}; 