const Message = require('../models/Message.model');

// Channel definitions with role access
const CHANNELS = [
  { name: 'general', label: 'General', roles: ['admin', 'manager', 'employee'] },
  { name: 'announcements', label: 'Announcements', roles: ['admin', 'manager', 'employee'] },
  { name: 'engineering', label: 'Engineering', roles: ['admin', 'manager', 'employee'] },
  { name: 'design', label: 'Design', roles: ['admin', 'manager', 'employee'] },
  { name: 'management', label: 'Management', roles: ['admin', 'manager'] },
  { name: 'leadership', label: 'Leadership', roles: ['admin'] },
];

const getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    
    // Check if user has access to this channel
    const channel = CHANNELS.find(c => c.name === room);
    if (channel && !channel.roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this channel' });
    }

    const messages = await Message.find({ room })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    // Return channels the user has access to based on their role
    const userRole = req.user.role;
    const accessibleChannels = CHANNELS.filter(c => c.roles.includes(userRole));
    res.json({ success: true, data: accessibleChannels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, getRooms };
