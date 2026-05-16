const Message = require('../models/Message.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');

// Channel definitions with role access
const CHANNELS = [
  { name: 'general', label: 'General', roles: ['admin', 'manager', 'employee'] },
  { name: 'announcements', label: 'Announcements', roles: ['admin', 'manager', 'employee'] },
  { name: 'engineering', label: 'Engineering', roles: ['admin', 'manager', 'employee'] },
  { name: 'design', label: 'Design', roles: ['admin', 'manager', 'employee'] },
  { name: 'management', label: 'Management', roles: ['admin', 'manager'] },
  { name: 'leadership', label: 'Leadership', roles: ['admin'] },
];

// Helper: generate a deterministic DM room id (sorted so both users get same room)
const getDmRoomId = (userId1, userId2) => {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `dm:${sorted[0]}_${sorted[1]}`;
};

const getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    const userId = req.user._id;

    // Check static channel access
    const channel = CHANNELS.find(c => c.name === room);
    if (channel && !channel.roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this channel' });
    }

    // Check DM room access
    if (room.startsWith('dm:')) {
      const ids = room.replace('dm:', '').split('_');
      if (!ids.includes(userId.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
      }
    }

    // Check project channel access
    if (room.startsWith('project:')) {
      const projectId = room.replace('project:', '');
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const isMember = project.members.some(m => m.toString() === userId.toString())
        || (project.manager && project.manager.toString() === userId.toString())
        || req.user.role === 'admin';
      if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    const messages = await Message.find({
      room,
      deletedForEveryone: { $ne: true },
      deletedFor: { $nin: [userId] }
    })
      .populate('sender', 'name email role')
      .populate('reactions.user', 'name')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const accessibleChannels = CHANNELS.filter(c => c.roles.includes(userRole));

    // Get project channels the user belongs to
    let projectQuery;
    if (userRole === 'admin') {
      projectQuery = {}; // admins see all projects
    } else {
      projectQuery = { $or: [{ members: userId }, { manager: userId }] };
    }
    const projects = await Project.find(projectQuery)
      .select('title _id members manager')
      .populate('members', 'name')
      .populate('manager', 'name');

    const projectChannels = projects.map(p => ({
      name: `project:${p._id}`,
      label: p.title,
      type: 'project',
      memberCount: (p.members?.length || 0) + (p.manager ? 1 : 0),
      members: [
        ...(p.manager ? [{ name: p.manager.name, role: 'manager' }] : []),
        ...(p.members || []).map(m => ({ name: m.name }))
      ]
    }));

    // Get DM conversations the user is part of (rooms that have messages)
    const dmRooms = await Message.aggregate([
      { $match: { room: { $regex: /^dm:/ }, deletedForEveryone: { $ne: true } } },
      { $group: { _id: '$room', lastMessage: { $last: '$content' }, lastAt: { $last: '$createdAt' } } },
      { $sort: { lastAt: -1 } }
    ]);

    // Filter to only DMs where current user is a participant
    const userIdStr = userId.toString();
    const userDmRooms = [];
    for (const dm of dmRooms) {
      const ids = dm._id.replace('dm:', '').split('_');
      if (ids.includes(userIdStr)) {
        const otherUserId = ids[0] === userIdStr ? ids[1] : ids[0];
        const otherUser = await User.findById(otherUserId).select('name email avatar role isActive lastSeen');
        if (otherUser) {
          userDmRooms.push({
            name: dm._id,
            label: otherUser.name,
            type: 'dm',
            otherUser: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              avatar: otherUser.avatar,
              role: otherUser.role,
              isActive: otherUser.isActive,
              lastSeen: otherUser.lastSeen
            },
            lastMessage: dm.lastMessage,
            lastAt: dm.lastAt
          });
        }
      }
    }

    res.json({ success: true, data: [...accessibleChannels, ...projectChannels, ...userDmRooms] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit message (only within 2 minutes, only own message)
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Can only edit your own messages' });
    }
    const twoMinutes = 2 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > twoMinutes) {
      return res.status(400).json({ success: false, message: 'Can only edit messages within 2 minutes' });
    }
    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    await message.populate('sender', 'name email role');
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete for me
const deleteForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    message.deletedFor.addToSet(req.user._id);
    await message.save();
    res.json({ success: true, message: 'Message hidden for you' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete for everyone (admin or sender within 2 min)
const deleteForEveryone = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = message.sender.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.deletedForEveryone = true;
    message.content = 'This message was deleted';
    await message.save();
    res.json({ success: true, data: { _id: message._id, room: message.room } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle reaction
const toggleReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      r => r.emoji === emoji && r.user.toString() === userId.toString()
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await message.save();
    await message.populate('reactions.user', 'name');
    await message.populate('sender', 'name email role');
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with online status for DM list
const getChatUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email avatar role isActive lastSeen')
      .sort({ isActive: -1, name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, getRooms, editMessage, deleteForMe, deleteForEveryone, toggleReaction, getChatUsers, getDmRoomId };
