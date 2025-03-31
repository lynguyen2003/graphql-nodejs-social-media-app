import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import { environmentVariablesConfig } from '../config/appConfig.js';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: environmentVariablesConfig.awsRegion,
  credentials: {
    accessKeyId: environmentVariablesConfig.awsAccessKeyId,
    secretAccessKey: environmentVariablesConfig.awsSecretAccessKey,
  },
});

const BUCKET_NAME = environmentVariablesConfig.awsS3Bucket;
const CLOUDFRONT_DOMAIN = environmentVariablesConfig.awsCloudfrontDomain;

export async function presignedUrl(postType: string, fileName: string, fileType: string) {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (!allowedTypes.includes(fileType)) {
    throw new Error('Unsupported file type');
  }

  if (postType === 'reel' && !fileType.startsWith('video/')) {
    throw new Error('Reels must be video files');
  }

  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `/${postType}/${uuidv4()}.${fileExtension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: uniqueFileName,
    ContentType: fileType,
  };

  const command = new PutObjectCommand(params);
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const finalUrl = `https://${CLOUDFRONT_DOMAIN}/${uniqueFileName}`;

  return {
    uploadUrl,
    postId: uuidv4(),
    fileName: uniqueFileName,
    url: finalUrl
  };
}

export async function deleteMediaFromS3(key: string) {
  if (!key) return;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}