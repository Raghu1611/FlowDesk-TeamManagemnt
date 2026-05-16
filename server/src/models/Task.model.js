const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  loggedHours: { type: Number, default: 0 },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: String
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  labels: [{ type: String }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
