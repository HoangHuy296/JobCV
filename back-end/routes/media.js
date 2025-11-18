const express = require('express');
const router = express.Router();
const { upload, createUploadMiddleware, uploadMedia, createMediaFromUrl, getMediaById, deleteMedia } = require('../controllers/MediaController');
const authenticate = require('../middleware/auth');

// Create upload middleware with dynamic file size limit
let dynamicUpload;
(async () => {
  try {
    dynamicUpload = await createUploadMiddleware();
  } catch (error) {
    console.error('Failed to create dynamic upload middleware:', error);
  }
})();

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media management
 */

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/Media'
 *                 message:
 *                   type: string
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error uploading file
 */
// Use a middleware wrapper to ensure upload middleware is ready
router.post('/upload', authenticate, (req, res, next) => {
  if (dynamicUpload) {
    return dynamicUpload.single('file')(req, res, next);
  }
  // Fallback to default if dynamic middleware isn't ready
  upload.single('file')(req, res, next);
}, uploadMedia);

/**
 * @swagger
 * /api/media/from-url:
 *   post:
 *     summary: Create media record from external URL
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: External URL of the image
 *               original_name:
 *                 type: string
 *                 description: Optional original name for the media
 *     responses:
 *       200:
 *         description: Media record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/Media'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid URL or missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error creating media record
 */
router.post('/from-url', authenticate, createMediaFromUrl);

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get a media by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         description: Media not found
 *       500:
 *         description: Error fetching media
 */
router.get('/:id', getMediaById);

/**
 * @swagger
 * /api/media/{id}:
 *   delete:
 *     summary: Delete a media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *       404:
 *         description: Media not found
 *       500:
 *         description: Error deleting media
 */
/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get all media with pagination and search
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filename or original_name
 *     responses:
 *       200:
 *         description: List of media
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     media:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Media'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: Error fetching media
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const Media = require('../models/Media');
    
    const result = await Media.getAllMedia(page, limit, search);
    
    res.status(200).json({
      result: {
        media: result.media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Error fetching media' 
    });
  }
});

router.delete('/:id', authenticate, deleteMedia);

module.exports = router;
