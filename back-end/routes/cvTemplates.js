const express = require('express');
const router = express.Router();
const multer = require('multer');
 const fs = require('fs');
const path = require('path');
const CVTemplateController = require('../controllers/CVTemplateController');
const authenticate = require('../middleware/auth');

// Configure multer for template image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'templates');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP, SVG)'));
    }
  }
});

// ============ PUBLIC ROUTES (không cần auth) ============

/**
 * @swagger
 * /api/cv-templates/published:
 *   get:
 *     summary: Lấy danh sách templates đã publish (public)
 *     tags: [CV Templates]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mô tả
 *     responses:
 *       200:
 *         description: Danh sách templates
 */
router.get('/published', CVTemplateController.getPublishedTemplates);

/**
 * @swagger
 * /api/cv-templates/categories:
 *   get:
 *     summary: Lấy danh sách categories
 *     tags: [CV Templates]
 *     responses:
 *       200:
 *         description: Danh sách categories
 */
router.get('/categories', CVTemplateController.getCategories);

/**
 * @swagger
 * /api/cv-templates/{id}/preview:
 *   get:
 *     summary: Xem preview template (public)
 *     tags: [CV Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Thông tin template
 *       404:
 *         description: Không tìm thấy template
 */
router.get('/:id/preview', CVTemplateController.getTemplatePreview);

// Apply authentication middleware to protected routes
router.use(authenticate);

// ============ AUTHENTICATED USER ROUTES ============

/**
 * @swagger
 * /api/cv-templates/upload-image:
 *   post:
 *     summary: Upload hình ảnh template (Admin only)
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: URL của hình ảnh đã upload
 */
router.post('/upload-image', authenticate, upload.single('image'), CVTemplateController.uploadTemplateImage);

/**
 * @swagger
 * /api/cv-templates/create-cv:
 *   post:
 *     summary: Tạo CV từ template
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               template_data:
 *                 type: object
 *     responses:
 *       201:
 *         description: CV đã được tạo
 *       404:
 *         description: Template không tồn tại
 */
router.post('/create-cv', CVTemplateController.createCVFromTemplate);

/**
 * @swagger
 * /api/cv-templates/update-cv/{id}:
 *   put:
 *     summary: Cập nhật CV từ template (user)
 *     tags: [CV Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: CV ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               data:
 *                 type: object
 *                 description: Dữ liệu user điền vào các fields
 *     responses:
 *       200:
 *         description: Cập nhật CV thành công
 *       404:
 *         description: Không tìm thấy CV
 */
router.put('/update-cv/:id', CVTemplateController.updateCVFromTemplate);

// ============ ADMIN ROUTES ============

/**
 * @swagger
 * /api/cv-templates:
 *   get:
 *     summary: Lấy tất cả templates (admin)
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: is_published
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách templates
 */
router.get('/', CVTemplateController.getAllTemplates);

/**
 * @swagger
 * /api/cv-templates/{id}:
 *   get:
 *     summary: Lấy template theo ID (admin)
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin template
 *       404:
 *         description: Không tìm thấy template
 */
router.get('/:id', CVTemplateController.getTemplateById);

/**
 * @swagger
 * /api/cv-templates:
 *   post:
 *     summary: Tạo template mới (admin) - Image-based only
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - thumbnail_url
 *               - structure
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail_url:
 *                 type: string
 *                 description: URL hình ảnh template (bắt buộc)
 *               category:
 *                 type: string
 *                 enum: [professional, modern, creative, general]
 *               structure:
 *                 type: object
 *                 description: '{fields: [{id, type, label, x, y, width, height, ...}]}'
 *               layout:
 *                 type: string
 *                 default: image-based
 *               is_published:
 *                 type: boolean
 *               is_premium:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo template thành công
 */
router.post('/', CVTemplateController.createTemplate);

/**
 * @swagger
 * /api/cv-templates/{id}:
 *   put:
 *     summary: Cập nhật template (admin)
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật template thành công
 *       404:
 *         description: Không tìm thấy template
 */
router.put('/:id', CVTemplateController.updateTemplate);

/**
 * @swagger
 * /api/cv-templates/{id}:
 *   delete:
 *     summary: Xóa template (admin)
 *     tags: [CV Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa template thành công
 *       404:
 *         description: Không tìm thấy template
 */
router.delete('/:id', CVTemplateController.deleteTemplate);

module.exports = router;
