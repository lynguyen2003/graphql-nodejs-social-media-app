import cron from 'node-cron';
import { models } from '../data/models';
import { logger } from './logger';

export const setupMediaCleanup = () => {
    // Run every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        try {
            // Find all stories that have expired
            const expiredStories = await models.Posts.find({
                type: 'story',
                expiresAt: { $lt: new Date() }
            }).lean();
            
            logger.info(`Found ${expiredStories.length} expired stories to clean up`);
            
            // Delete posts from database
            for (const story of expiredStories) {
                try {
                    // Delete post from database
                    await models.Posts.findByIdAndDelete(story._id);
                    
                    // Delete reference from user
                    await models.Users.updateOne(
                        { _id: story.author },
                        { $pull: { posts: story._id } }
                    );
                } catch (error) {
                    logger.error(`Error cleaning up story ${story._id}:`, error);
                }
            }
            
            logger.info('Media cleanup completed');
        } catch (error) {
            logger.error('Error in media cleanup job:', error);
        }
    });
}; 