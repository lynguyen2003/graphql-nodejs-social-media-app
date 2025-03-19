import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from '../helpers/logger.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const client = createClient({
    url: redisUrl
});

client.on('error', (err) => {
    logger.error('Redis Client Error', err);
});

export const connectRedis = async () => {
    try {
        await client.connect();
        logger.info('Connected to Redis');
        return client;
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        return null;
    }
};

export default client;

const incrementView = async (postId) => {
    if (!postId) {
        throw new Error('Post ID is required');
    }
    await client.incr(`post:${postId}:views`);
    await client.sAdd('posts:to_sync', postId);
};

const getViewCount = async (postId) => {
    if (!postId) {
        throw new Error('Post ID is required');
    }
    const count = await client.get(`post:${postId}:views`);
    return count ? parseInt(count) : 0;
};

const getPostsToSync = async () => {
    return client.sMembers('posts:to_sync');
};

const removePostFromSyncList = async (postId) => {
    return client.sRem('posts:to_sync', postId);
};

export {
    incrementView,
    getViewCount,
    getPostsToSync,
    removePostFromSyncList
};