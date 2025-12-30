const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getAllCVs, getUserCVs, uploadCV, downloadCV, deleteCV, checkCVInApplications } = require('../controllers/CVController');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Middleware to check admin or recruiter role
const requireAdminOrRecruiter = (req, res, next) => {
  if (req.user.role.name !== 'admin' && req.user.role.name !== 'recruiter') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bạn không có quyền truy cập' 
    });
  }
  next();
};

// Configure multer for CV file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'cvs');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF, Word documents, and common image formats
    const allowedTypes = /pdf|doc|docx|jpeg|jpg|png|gif|webp|svg|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chễ chấp nhận file PDF, Word (DOC/DOCX) hoặc ảnh (JPG, PNG, GIF, WEBP, SVG, HEIC)'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: CVs
 *   description: CV management
 */

/**
 * @swagger
 * /api/cvs:
 *   get:
 *     summary: Get all CVs for the current user
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user's CVs with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     cvs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CV'
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Admin and Recruiter route - get all CVs
router.get('/admin/all', authenticate, requireAdminOrRecruiter, getAllCVs);

// User route - get user's CVs
router.get('/', authenticate, getUserCVs);

/**
 * @swagger
 * /api/cvs:
 *   post:
 *     summary: Upload a new CV file
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: CV title
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CV file (PDF, Word document, or image)
 *             required:
 *               - title
 *               - file
 *     responses:
 *       201:
 *         description: CV uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       $ref: '#/components/schemas/CV'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing title or file
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, upload.single('file'), uploadCV);

/**
 * @swagger
 * /api/cvs/{id}:
 *   get:
 *     summary: Download a CV file
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: CV ID
 *     responses:
 *       200:
 *         description: CV file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/msword:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: CV not found
 *       500:
 *         description: Server error
 */
router.get('/:id', optionalAuth, downloadCV);

/**
 * @swagger
 * /api/cvs/{id}/check-applications:
 *   get:
 *     summary: Check if CV is used in job applications
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: CV ID
 *     responses:
 *       200:
 *         description: CV application check result
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: CV not found
 */
router.get('/:id/check-applications', authenticate, checkCVInApplications);

/**
 * @swagger
 * /api/cvs/{id}:
 *   delete:
 *     summary: Delete a CV
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: CV ID
 *     responses:
 *       200:
 *         description: CV deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: CV not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, deleteCV);


module.exports = router;
