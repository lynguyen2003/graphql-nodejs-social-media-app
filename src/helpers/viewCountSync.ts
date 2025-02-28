import { getPostsToSync, getViewCount, removePostFromSyncList } from '../config/redisDb.js';
import { models } from '../data/models/index.js';

export const syncViewCounts = async () => {
    try {
        const postsToSync = await getPostsToSync();
        
        if (postsToSync.length === 0) {
            return;
        }
        
        for (const postId of postsToSync) {
            const viewCount = await getViewCount(postId);
            
            await models.Posts.findByIdAndUpdate(postId, {
                viewCount
            });
            
            await removePostFromSyncList(postId);
        }
    } catch (error) {
        console.error('Error syncing view counts function:', error);
    }
};

export const setupViewCountSync = () => {
    syncViewCounts();
    setInterval(syncViewCounts, 10 * 1000);
};