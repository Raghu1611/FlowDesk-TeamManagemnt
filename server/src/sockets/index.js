const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');

const onlineUsers = new Map(); // socketId -> { userId, name, email, avatar, role }

module.exports = (io) => {
  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.user = user;
          return next();
        }
      }
      // Allow unauthenticated connections but mark them
      socket.user = null;
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id, socket.user?.name || 'anonymous');

    // Track online users
    if (socket.user) {
      onlineUsers.set(socket.id, {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        email: socket.user.email,
        avatar: socket.user.avatar || '',
        role: socket.user.role
      });
      
      // Join personal notification room
      socket.join(`user:${socket.user._id}`);
      
      // Update lastSeen & isActive
      await User.findByIdAndUpdate(socket.user._id, { lastSeen: new Date(), isActive: true }).exec();
      
      // Auto-join existing DM rooms so messages arrive in real-time
      const userId = socket.user._id.toString();
      const dmRooms = await Message.distinct('room', { room: { $regex: /^dm:/ } });
      for (const room of dmRooms) {
        const ids = room.replace('dm:', '').split('_');
        if (ids.includes(userId)) {
          socket.join(room);
        }
      }
      
      // Broadcast online users list
      const uniqueOnline = [...new Map([...onlineUsers.values()].map(u => [u.userId, u])).values()];
      io.emit('users:online', uniqueOnline);
    }

    // Chat events
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`${socket.user?.name || socket.id} joined room ${room}`);
      socket.to(room).emit('user:joined_room', {
        user: socket.user?.name || 'Anonymous',
        room
      });
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      socket.to(room).emit('user:left_room', {
        user: socket.user?.name || 'Anonymous',
        room
      });
    });

    socket.on('send_message', async (data) => {
      try {
        // Persist message to DB
        if (socket.user) {
          const message = await Message.create({
            room: data.room,
            sender: socket.user._id,
            content: data.content,
            type: data.type || 'text',
            ...(data.attachment && { attachment: { url: data.attachment.url, name: data.attachment.name } })
          });
          await message.populate('sender', 'name email role avatar');
          
          const payload = {
            _id: message._id,
            room: message.room,
            sender: message.sender,
            content: message.content,
            type: message.type,
            attachment: message.attachment || null,
            reactions: [],
            edited: false,
            createdAt: message.createdAt
          };

          // For DM rooms, ensure both users' sockets are in the room
          if (data.room.startsWith('dm:')) {
            const ids = data.room.replace('dm:', '').split('_');
            for (const [sid, u] of onlineUsers.entries()) {
              if (ids.includes(u.userId)) {
                const s = io.sockets.sockets.get(sid);
                if (s) s.join(data.room);
              }
            }
          }

          io.to(data.room).emit('receive_message', payload);
          
          // For DMs, also emit a notification to the other user's personal room
          if (data.room.startsWith('dm:')) {
            const ids = data.room.replace('dm:', '').split('_');
            const otherUserId = ids.find(id => id !== socket.user._id.toString());
            if (otherUserId) {
              io.to(`user:${otherUserId}`).emit('dm:new_message', {
                room: data.room,
                sender: message.sender,
                content: message.content,
                createdAt: message.createdAt
              });
            }
          }
        }
      } catch (err) {
        console.error('Error saving message:', err.message);
      }
    });

    // Edit message (real-time)
    socket.on('edit_message', async (data) => {
      try {
        if (!socket.user) return;
        const message = await Message.findById(data.messageId);
        if (!message || message.sender.toString() !== socket.user._id.toString()) return;
        const twoMin = 2 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > twoMin) return;
        message.content = data.content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        await message.populate('sender', 'name email role');
        await message.populate('reactions.user', 'name');
        io.to(message.room).emit('message:edited', {
          _id: message._id, room: message.room, content: message.content,
          sender: message.sender, edited: true, editedAt: message.editedAt,
          reactions: message.reactions, createdAt: message.createdAt
        });
      } catch (err) { console.error('Edit error:', err.message); }
    });

    // Delete for me (only emits back to the sender)
    socket.on('delete_for_me', async (data) => {
      try {
        if (!socket.user) return;
        const message = await Message.findById(data.messageId);
        if (!message) return;
        message.deletedFor.addToSet(socket.user._id);
        await message.save();
        socket.emit('message:deleted_for_me', { _id: message._id, room: message.room });
      } catch (err) { console.error('Delete for me error:', err.message); }
    });

    // Delete for everyone (admin or sender)
    socket.on('delete_for_everyone', async (data) => {
      try {
        if (!socket.user) return;
        const message = await Message.findById(data.messageId);
        if (!message) return;
        const isAdmin = socket.user.role === 'admin';
        const isOwner = message.sender.toString() === socket.user._id.toString();
        if (!isAdmin && !isOwner) return;
        message.deletedForEveryone = true;
        message.content = 'This message was deleted';
        await message.save();
        io.to(message.room).emit('message:deleted_for_everyone', { _id: message._id, room: message.room });
      } catch (err) { console.error('Delete for everyone error:', err.message); }
    });

    // Toggle reaction (real-time)
    socket.on('toggle_reaction', async (data) => {
      try {
        if (!socket.user) return;
        const message = await Message.findById(data.messageId);
        if (!message) return;
        const userId = socket.user._id;
        const existingIdx = message.reactions.findIndex(
          r => r.emoji === data.emoji && r.user.toString() === userId.toString()
        );
        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1);
        } else {
          message.reactions.push({ emoji: data.emoji, user: userId });
        }
        await message.save();
        await message.populate('reactions.user', 'name');
        await message.populate('sender', 'name email role');
        io.to(message.room).emit('message:reaction_updated', {
          _id: message._id, room: message.room,
          reactions: message.reactions
        });
      } catch (err) { console.error('Reaction error:', err.message); }
    });

    socket.on('typing_start', (data) => {
      socket.to(data.room).emit('typing_start', {
        user: socket.user?.name || 'Anonymous',
        room: data.room
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.room).emit('typing_stop', {
        user: socket.user?.name || 'Anonymous',
        room: data.room
      });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      onlineUsers.delete(socket.id);
      
      if (socket.user) {
        // Only set offline if no other sockets for this user
        const stillOnline = [...onlineUsers.values()].some(u => u.userId === socket.user._id.toString());
        if (!stillOnline) {
          await User.findByIdAndUpdate(socket.user._id, { lastSeen: new Date(), isActive: false }).exec();
        }
      }
      
      const uniqueOnline = [...new Map([...onlineUsers.values()].map(u => [u.userId, u])).values()];
      io.emit('users:online', uniqueOnline);
    });
  });
};
