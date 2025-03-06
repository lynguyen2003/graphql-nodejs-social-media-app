import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { logger } from '../helpers/logger';

const unlinkAsync = promisify(fs.unlink);

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const bucketName = process.env.AWS_S3_BUCKET;
const cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;


const createS3Path = (userId, postType, postId, fileName, variant = 'original') => {
    return `users/${userId}/${postType}s/${postId}/${variant}/${fileName}`;
};


const createCloudfrontUrl = (s3Path) => {
    return `https://${cloudfrontDomain}/${s3Path}`;
};

/**
 * Create a signed URL with a time limit for direct file upload from the client
 */
export const generatePresignedUploadUrl = async (userId, postType, fileName, contentType) => {
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const postId = uuidv4();
    
    const s3Path = createS3Path(userId, postType, postId, uniqueFileName);
    
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Path,
        ContentType: contentType
    });
    
    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        
        return {
            uploadUrl: signedUrl,
            fileUrl: createCloudfrontUrl(s3Path),
            postId,
            fileName: uniqueFileName
        };
    } catch (error) {
        logger.error('Error generating presigned URL:', error);
        throw new Error('Failed to generate upload URL');
    }
};

/**
 * Process and upload image
 */
export const processAndUploadImage = async (userId, postType, postId, file, options = {}) => {
    const { width, height, quality = 80 } = options as { width: number, height: number, quality: number };
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    
    try {
        // Process image with sharp
        let imageProcessor = sharp(file.path);
        
        if (width && height) {
            imageProcessor = imageProcessor.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // Compress image
        const processedImageBuffer = await imageProcessor
            .jpeg({ quality })
            .toBuffer();
        
        // Create S3 path
        const s3Path = createS3Path(userId, postType, postId, uniqueFileName, 'processed');
        
        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Path,
            Body: processedImageBuffer,
            ContentType: 'image/jpeg'
        });
        
        await s3Client.send(command);
        
        // Create thumbnail
        const thumbnailBuffer = await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();
        
        const thumbnailPath = createS3Path(userId, postType, postId, `thumb_${uniqueFileName}`, 'thumbnails');
        
        const thumbnailCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: thumbnailPath,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg'
        });
        
        await s3Client.send(thumbnailCommand);
        
        // Delete temporary file
        await unlinkAsync(file.path);
        
        return {
            url: createCloudfrontUrl(s3Path),
            thumbnailUrl: createCloudfrontUrl(thumbnailPath),
            key: s3Path
        };
    } catch (error) {
        logger.error('Error processing and uploading image:', error);
        
        // Delete temporary file if there is an error
        try {
            await unlinkAsync(file.path);
        } catch (unlinkError) {
            logger.error('Error deleting temporary file:', unlinkError);
        }
        
        throw new Error('Failed to process and upload image');
    }
};

/**
 * Process and upload video
 */
export const processAndUploadVideo = async (userId, postType, postId, file) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    
    try {
        // Create S3 path
        const s3Path = createS3Path(userId, postType, postId, uniqueFileName, 'original');
        
        // Read file
        const fileContent = fs.readFileSync(file.path);
        
        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Path,
            Body: fileContent,
            ContentType: file.mimetype
        });
        
        await s3Client.send(command);
        
        // Delete temporary file
        await unlinkAsync(file.path);
        
        // Lưu ý: Xử lý video nâng cao (tạo nhiều phiên bản, thumbnail) 
        // thường được thực hiện bởi dịch vụ như AWS MediaConvert
        // Đây là phiên bản đơn giản chỉ tải lên file gốc
        
        return {
            url: createCloudfrontUrl(s3Path),
            key: s3Path
        };
    } catch (error) {
        logger.error('Error uploading video:', error);
        
        // Delete temporary file if there is an error
        try {
            await unlinkAsync(file.path);
        } catch (unlinkError) {
            logger.error('Error deleting temporary file:', unlinkError);
        }
        
        throw new Error('Failed to upload video');
    }
};

/**
 * Delete file from S3
 */
export const deleteMediaFromS3 = async (s3Key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key
        });
        
        await s3Client.send(command);
        return true;
    } catch (error) {
        logger.error('Error deleting media from S3:', error);
        throw new Error('Failed to delete media');
    }
};

/**
 * Process media based on post type
 */
export const processMediaByPostType = async (userId, postType, postId, file) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (!isImage && !isVideo) {
        throw new Error('Unsupported file type');
    }
    
    switch (postType) {
        case 'post':
            if (isImage) {
                return await processAndUploadImage(userId, postType, postId, file);
            } else {
                return await processAndUploadVideo(userId, postType, postId, file);
            }
            
        case 'reel':
            if (!isVideo) {
                throw new Error('Reels must be video files');
            }
            return await processAndUploadVideo(userId, postType, postId, file);
            
        case 'story':
            if (isImage) {
                return await processAndUploadImage(userId, postType, postId, file);
            } else {
                return await processAndUploadVideo(userId, postType, postId, file);
            }
            
        default:
            throw new Error('Invalid post type');
    }
}; 