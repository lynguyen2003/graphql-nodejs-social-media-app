import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
    await client.connect();
    console.log('Connected to Redis');
};

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
    connectRedis,
    incrementView,
    getViewCount,
    getPostsToSync,
    removePostFromSyncList
};