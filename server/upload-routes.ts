import { Router, type Request, type Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image endpoint
router.post('/upload-image', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    // Upload to Cloudinary
    // The image should be a base64 data URL (e.g., "data:image/png;base64,...")
    const result = await cloudinary.uploader.upload(image, {
      folder: 'social-spotlight/avatars',
      resource_type: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    // Return the secure URL
    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

// Delete image endpoint (optional - for cleanup)
router.delete('/delete-image', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      details: error.message
    });
  }
});

export default router;
