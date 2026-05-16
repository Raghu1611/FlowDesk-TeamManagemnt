const express = require('express');
const { getMessages, getRooms } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /messages/rooms:
 *   get:
 *     summary: Get chat rooms
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms
 */
router.get('/rooms', protect, getRooms);

/**
 * @swagger
 * /messages/{room}:
 *   get:
 *     summary: Get messages for a room
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: room
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/:room', protect, getMessages);

module.exports = router;
