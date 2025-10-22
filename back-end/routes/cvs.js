const express = require('express');
const router = express.Router();
const { getUserCVs, downloadCV, deleteCV, getPublicTemplates, getTemplateById, createTemplateFromCV } = require('../controllers/CVController');
const authenticate = require('../middleware/auth');

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
 *     responses:
 *       200:
 *         description: List of user's CVs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cvs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CV'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getUserCVs);

/**
 * @swagger
 * /api/cvs/{id}:
 *   get:
 *     summary: Download a CV
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
 *         description: CV file or JSON content
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
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 content:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: CV not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, downloadCV);

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

/**
 * @swagger
 * /api/cvs/templates:
 *   get:
 *     summary: Get all public CV templates
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of public CV templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CV'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticate, getPublicTemplates);

/**
 * @swagger
 * /api/cvs/templates/{id}:
 *   get:
 *     summary: Get a specific CV template
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: CV template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 template:
 *                   $ref: '#/components/schemas/CV'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get('/templates/:id', authenticate, getTemplateById);

/**
 * @swagger
 * /api/cvs/create-template:
 *   post:
 *     summary: Create a template from an existing CV
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cvId:
 *                 type: integer
 *                 description: ID of the CV to create template from
 *               title:
 *                 type: string
 *                 description: Title for the new template
 *             required:
 *               - cvId
 *               - title
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 templateId:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create-template', authenticate, createTemplateFromCV);

module.exports = router;
