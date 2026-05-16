require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { Server } = require('socket.io');
const setupSockets = require('./src/sockets');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });
  
  app.set('io', io);
  setupSockets(io);
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
 
