const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    url: String,
    name: String
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
