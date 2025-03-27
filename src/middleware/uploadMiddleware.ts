import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UserInputError } from 'apollo-server-express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer to save temporary files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Check file type
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new UserInputError('Unsupported file type'), false);
    }
};

// Limit file size
const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB
};

// Middleware upload
export const upload = multer({
    storage,
    fileFilter,
    limits
});

// Middleware validate file type based on post type
export const validateFileTypeByPostType = (req, res, next) => {
    const { postType } = req.params;
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    switch (postType) {
        case 'reel':
            if (!isVideo) {
                // Delete uploaded file
                fs.unlinkSync(file.path);
                return res.status(400).json({ error: 'Reels must be video files' });
            }
            break;
            
        case 'post':
            break;
            
        case 'story':
            // Both images and videos are accepted
            break;
            
        default:
            // Delete uploaded file
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Invalid post type' });
    }
    
    next();
}; 