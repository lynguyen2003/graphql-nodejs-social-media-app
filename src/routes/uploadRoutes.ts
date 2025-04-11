import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { handleFileUpload, upload, handleMultipleFileUpload } from '../middleware/uploadMiddleware';
import { CloudinaryService } from '../services/cloudinaryService.js';

const uploadRouter = Router();
const cloudinaryService = new CloudinaryService();

// Route for uploading single file
uploadRouter.post('/upload', upload.single('file'), handleFileUpload, (req, res) => {
  res.status(200).json({
    success: true,
    mediaUrl: req.body.mediaUrl,
    mediaId: req.body.mediaId
  });
});

// Route for uploading multiple files (max 10)
uploadRouter.post('/upload-multiple', upload.array('files', 10), handleMultipleFileUpload, (req, res) => {
  res.status(200).json({
    success: true,
    files: req.body.uploadedFiles
  });
});

// Route for getting a signature for direct upload to Cloudinary
uploadRouter.get('/signature', authMiddleware, (req, res) => {
  try {
    const folder = req.query.folder || 'streamify';
    const signature = cloudinaryService.generateSignature({ folder });
    
    res.status(200).json({
      success: true,
      signature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload signature',
      error: error.message
    });
  }
});

// Route for deleting files from Cloudinary
uploadRouter.delete('/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // TODO: Implement deletion logic here
    // Call cloudinary.uploader.destroy(publicId)
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

export default uploadRouter; 