const express = require('express');
const { getMessages, getRooms, editMessage, deleteForMe, deleteForEveryone, toggleReaction, getChatUsers } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

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
 * /messages/users:
 *   get:
 *     summary: Get all users for DM with online status
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with online/lastSeen info
 */
router.get('/users', protect, getChatUsers);

/**
 * @swagger
 * /messages/upload:
 *   post:
 *     summary: Upload a file for chat messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded file URL and name
 */
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const fileUrl = req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, name: req.file.originalname });
});

/**
 * @swagger
 * /messages/{id}/edit:
 *   patch:
 *     summary: Edit a message (within 2 minutes)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/edit', protect, editMessage);

/**
 * @swagger
 * /messages/{id}/delete-for-me:
 *   patch:
 *     summary: Delete message for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/delete-for-me', protect, deleteForMe);

/**
 * @swagger
 * /messages/{id}/delete-for-everyone:
 *   delete:
 *     summary: Delete message for everyone (admin or sender)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/delete-for-everyone', protect, deleteForEveryone);

/**
 * @swagger
 * /messages/{id}/react:
 *   post:
 *     summary: Toggle reaction on a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/react', protect, toggleReaction);

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
