const express = require('express');
const router = express.Router();
const CVSectionController = require('../controllers/CVSectionController');
const authenticate = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

/**
 * @swagger
 * /api/cv-sections/active:
 *   get:
 *     summary: Lấy danh sách sections đang active (public)
 *     tags: [CV Sections]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo category (basic, professional, additional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên
 *     responses:
 *       200:
 *         description: Danh sách sections
 */
router.get('/active', CVSectionController.getActiveSections);

// Apply authentication middleware
router.use(authenticate);

// ============ USER ROUTES ============

/**
 * @swagger
 * /api/cv-sections/cv/{cvId}:
 *   get:
 *     summary: Lấy sections của CV (user)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cvId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách sections của CV
 */
router.get('/cv/:cvId', CVSectionController.getUserCVSections);

/**
 * @swagger
 * /api/cv-sections/cv/{cvId}:
 *   post:
 *     summary: Lưu section vào CV (user)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cvId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section_id:
 *                 type: integer
 *               position:
 *                 type: object
 *               data:
 *                 type: object
 *               is_visible:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lưu section thành công
 */
router.post('/cv/:cvId', CVSectionController.saveUserCVSection);

/**
 * @swagger
 * /api/cv-sections/user-section/{userSectionId}:
 *   put:
 *     summary: Cập nhật user section (user)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userSectionId
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
 *         description: Cập nhật thành công
 */
router.put('/user-section/:userSectionId', CVSectionController.updateUserCVSection);

/**
 * @swagger
 * /api/cv-sections/user-section/{userSectionId}:
 *   delete:
 *     summary: Xóa user section (user)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/user-section/:userSectionId', CVSectionController.deleteUserCVSection);

// ============ ADMIN ROUTES ============

/**
 * @swagger
 * /api/cv-sections:
 *   get:
 *     summary: Lấy tất cả sections (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sections
 */
router.get('/', CVSectionController.getAllSections);

/**
 * @swagger
 * /api/cv-sections/{id}:
 *   get:
 *     summary: Lấy section theo ID (admin)
 *     tags: [CV Sections]
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
 *         description: Thông tin section
 */
router.get('/:id', CVSectionController.getSectionById);

/**
 * @swagger
 * /api/cv-sections:
 *   post:
 *     summary: Tạo section mới (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               key_name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               default_fields:
 *                 type: object
 *               category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo section thành công
 */
router.post('/', CVSectionController.createSection);

/**
 * @swagger
 * /api/cv-sections/{id}:
 *   put:
 *     summary: Cập nhật section (admin)
 *     tags: [CV Sections]
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
 *         description: Cập nhật thành công
 */
router.put('/:id', CVSectionController.updateSection);

/**
 * @swagger
 * /api/cv-sections/{id}:
 *   delete:
 *     summary: Xóa section (admin)
 *     tags: [CV Sections]
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
 *         description: Xóa thành công
 */
router.delete('/:id', CVSectionController.deleteSection);

// ============ TEMPLATE SECTION ROUTES (ADMIN) ============

/**
 * @swagger
 * /api/cv-sections/template/{templateId}/sections:
 *   get:
 *     summary: Lấy sections của template (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách sections của template
 */
router.get('/template/:templateId/sections', CVSectionController.getTemplateSections);

/**
 * @swagger
 * /api/cv-sections/template/{templateId}/sections:
 *   post:
 *     summary: Thêm section vào template (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section_id:
 *                 type: integer
 *               position:
 *                 type: object
 *               custom_fields:
 *                 type: object
 *               is_required:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Thêm section thành công
 */
router.post('/template/:templateId/sections', CVSectionController.addSectionToTemplate);

/**
 * @swagger
 * /api/cv-sections/template-section/{templateSectionId}:
 *   put:
 *     summary: Cập nhật section trong template (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateSectionId
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
 *         description: Cập nhật thành công
 */
router.put('/template-section/:templateSectionId', CVSectionController.updateTemplateSection);

/**
 * @swagger
 * /api/cv-sections/template-section/{templateSectionId}:
 *   delete:
 *     summary: Xóa section khỏi template (admin)
 *     tags: [CV Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/template-section/:templateSectionId', CVSectionController.removeSectionFromTemplate);

module.exports = router;
