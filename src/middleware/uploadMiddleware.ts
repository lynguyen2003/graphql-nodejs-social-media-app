import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../helpers/logger.js';

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    }
});

export const uploadToCloudinary = async (buffer, folder, resourceType) => {
  try {
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    const uniqueFilename = `${folder}/${uuidv4()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'streamify',
          public_id: uniqueFilename,
          secure_url: true,
          resource_type: resourceType,
          overwrite: true,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    logger.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Middleware for handling single file upload
export const handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const folder = resourceType === 'image' ? 'images' : 'videos';

    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);

    req.body.mediaUrl = result.secure_url;
    req.body.mediaId = result.public_id;
    
    next();
  } catch (error) {
    logger.error('Upload middleware error:', error);
    return res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// Middleware for handling multiple file uploads
export const handleMultipleFileUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 files allowed' });
    }

    const uploadedFiles = [];
    const promises = [];

    // Process each file
    for (const file of req.files) {
      const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      const folder = resourceType === 'image' ? 'images' : 'videos';
      
      // Create a promise for each upload
      const uploadPromise = uploadToCloudinary(file.buffer, folder, resourceType)
        .then(result => {
          uploadedFiles.push({
            mediaUrl: result.secure_url,
            mediaId: result.public_id,
            resourceType: resourceType,
            originalName: file.originalname,
            size: file.size
          });
        });
      
      promises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    await Promise.all(promises);

    // Store results in the request body
    req.body.uploadedFiles = uploadedFiles;
    
    next();
  } catch (error) {
    logger.error('Multiple upload middleware error:', error);
    return res.status(500).json({ message: 'File uploads failed', error: error.message });
  }
};