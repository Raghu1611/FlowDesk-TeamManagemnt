const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');

const onlineUsers = new Map(); // socketId -> { userId, name, email }

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

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, socket.user?.name || 'anonymous');

    // Track online users
    if (socket.user) {
      onlineUsers.set(socket.id, {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        email: socket.user.email
      });
      
      // Join personal notification room
      socket.join(`user:${socket.user._id}`);
      
      // Update lastSeen
      User.findByIdAndUpdate(socket.user._id, { lastSeen: new Date(), isActive: true }).exec();
      
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
            type: data.type || 'text'
          });
          await message.populate('sender', 'name email');
          
          io.to(data.room).emit('receive_message', {
            _id: message._id,
            room: message.room,
            sender: message.sender,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt
          });
        } else {
          // Fallback for unauthenticated
          io.to(data.room).emit('receive_message', data);
        }
      } catch (err) {
        console.error('Error saving message:', err.message);
        io.to(data.room).emit('receive_message', data);
      }
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      onlineUsers.delete(socket.id);
      
      if (socket.user) {
        User.findByIdAndUpdate(socket.user._id, { lastSeen: new Date(), isActive: false }).exec();
      }
      
      const uniqueOnline = [...new Map([...onlineUsers.values()].map(u => [u.userId, u])).values()];
      io.emit('users:online', uniqueOnline);
    });
  });
};
