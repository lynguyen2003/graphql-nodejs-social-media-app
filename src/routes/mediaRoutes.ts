import { Router } from 'express';
import { upload, validateFileTypeByPostType } from '../middleware/uploadMiddleware.js';
import { processMediaByPostType, generatePresignedUploadUrl } from '../services/mediaService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { models } from '../data/models/index.js';

const mediaRouter = Router();

// Endpoint tạo presigned URL để client upload trực tiếp lên S3
mediaRouter.post('/presigned-url', authMiddleware, async (req, res) => {
    try {
        const { fileName, contentType, postType } = req.body;
        const userId = req.body.userId;
        
        if (!fileName || !contentType || !postType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!['post', 'reel', 'story'].includes(postType)) {
            return res.status(400).json({ error: 'Invalid post type' });
        }
        
        const result = await generatePresignedUploadUrl(userId, postType, fileName, contentType);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint upload file qua server
mediaRouter.post('/upload/:postType', authMiddleware, upload.single('media'), validateFileTypeByPostType, async (req, res) => {
    try {
        const { postType } = req.params;
        const { postId } = req.body;
        const userId = req.body._id;
        const file = req.body.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const result = await processMediaByPostType(userId, postType, postId || undefined, file);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default mediaRouter; 