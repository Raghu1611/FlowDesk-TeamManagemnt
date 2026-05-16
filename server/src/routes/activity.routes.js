const express = require('express');
const { getActivityLogs } = require('../controllers/activity.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /activity:
 *   get:
 *     summary: Get activity logs
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [task, project, user, message]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity log entries
 */
router.get('/', protect, authorize('admin', 'manager'), getActivityLogs);

module.exports = router;
