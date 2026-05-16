const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const activityRoutes = require('./routes/activity.routes');

const app = express();
const setupSwagger = require('./docs/swagger');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

setupSwagger(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FlowDesk API is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/activity', activityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
