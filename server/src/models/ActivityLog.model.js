const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_assigned',
      'task_status_changed', 'task_comment_added', 'task_attachment_added',
      'project_created', 'project_updated', 'project_deleted',
      'user_registered', 'user_role_changed',
      'message_sent'
    ],
    required: true
  },
  entity: {
    type: String,
    enum: ['task', 'project', 'user', 'message'],
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
