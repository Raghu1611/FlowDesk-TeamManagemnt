const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['task_assigned', 'task_updated', 'task_comment', 'task_due_soon', 'project_added', 'role_changed', 'mention'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String },
  entityType: { type: String, enum: ['task', 'project', 'user'] },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
