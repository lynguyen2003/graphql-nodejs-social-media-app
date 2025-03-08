import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { securityVariablesConfig } from '../config/appConfig.js';

let io: SocketIOServer;

// Map to store user socket connections
const userSocketMap = new Map<string, string[]>();

/**
 * Initialize WebSocket server
 */
export const initializeWebSocketServer = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, securityVariablesConfig.secret);
            socket.data.userId = decoded.userId;
            
            // Add socket to map
            const userId = decoded.userId;
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, []);
            }
            userSocketMap.get(userId).push(socket.id);

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.data.userId}`);

        // Register to user's private room
        socket.join(socket.data.userId);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.data.userId}`);
            
            // Remove socket from map
            const userId = socket.data.userId;
            if (userSocketMap.has(userId)) {
                const sockets = userSocketMap.get(userId);
                const index = sockets.indexOf(socket.id);
                if (index !== -1) {
                    sockets.splice(index, 1);
                }                if (sockets.length === 0) {
                    userSocketMap.delete(userId);
                }
            }
        });
    });

    return io;
};

/**
 * Send notification to a specific user
 */
export const sendNotificationToUser = (userId: string, notification: any) => {
    if (io) {
        io.to(userId).emit('notification', notification);
    }
};

/**
 * Send notification to multiple users
 */
export const sendNotificationToUsers = (userIds: string[], notification: any) => {
    if (io) {
        userIds.forEach(userId => {
            io.to(userId).emit('notification', notification);
        });
    }
};

/**
 * Send notification to all connected users
 */
export const sendNotificationToAll = (notification: any) => {
    if (io) {
        io.emit('notification', notification);
    }
};

/**
 * Check if a user is online
 */
export const isUserOnline = (userId: string): boolean => {
    return userSocketMap.has(userId) && userSocketMap.get(userId).length > 0;
};

/**
 * Get list of online users
 */
export const getOnlineUsers = (): string[] => {
    return Array.from(userSocketMap.keys());
};