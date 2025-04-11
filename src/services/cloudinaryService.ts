import cloudinary from '../config/cloudinary.js';

export class CloudinaryService {
  /**
   * Upload an image or video to Cloudinary
   * @param fileUrl URL of the file to upload
   * @param options Optional Cloudinary upload options
   * @returns Cloudinary upload result
   */
  async upload(fileUrl: string, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(
        fileUrl,
        {
            resource_type: 'auto',
            folder: 'streamify',
            overwrite: true,
            transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
            ]
        }
      )

      console.log(result);
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for uploading directly to Cloudinary
   * @param options Options for the upload signature
   * @returns Signed upload parameters
   */
  generateSignature(options = {}) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const defaultOptions = {
      timestamp,
      folder: 'streamify',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
    };

    const params = {
      ...defaultOptions,
      ...options
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      ...params
    };
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId Public ID of the file to delete
   * @param options Optional deletion options
   * @returns Deletion result
   */
  async delete(publicId: string, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'auto',
        invalidate: true
      };

      const result = await cloudinary.uploader.destroy(publicId, {
        ...defaultOptions,
        ...options
      });

      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Generate a URL with transformations
   * @param publicId Public ID of the image/video
   * @param transformations Array of transformation objects
   * @returns Transformed URL
   */
  getUrl(publicId: string, transformations = []) {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformations
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId The public ID of the file to delete
   * @returns Deletion result
   */
  async deleteFile(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const cloudinaryService = new CloudinaryService(); 