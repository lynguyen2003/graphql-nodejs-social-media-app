import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityVariablesConfig } from '../config/appConfig.js';
import { models } from '../data/models/index.js';

/**
 * Middleware to get the number of unread notifications for the current user
 */
export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, securityVariablesConfig.secret) as { userId: string };
        
        const unreadCount = await models.Notifications.countDocuments({
            recipient: decoded.userId,
            isRead: false
        });
        
        return res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Error in getUnreadNotifications middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}; 