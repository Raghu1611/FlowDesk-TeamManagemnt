const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const ActivityLog = require('../models/ActivityLog.model');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalUsers,
      tasksByStatus,
      tasksByPriority,
      recentActivity
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
      User.countDocuments({ isActive: true }),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      ActivityLog.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Tasks completed per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyCompleted = await Task.aggregate([
      { $match: { status: 'done', updatedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyCreated = await Task.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // My tasks (for current user)
    const myTasks = await Task.find({ assignee: req.user._id, status: { $ne: 'done' } })
      .sort({ dueDate: 1, priority: -1 })
      .limit(5)
      .populate('project', 'title');

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        totalUsers,
        tasksByStatus: tasksByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        tasksByPriority: tasksByPriority.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
        dailyCompleted,
        dailyCreated,
        recentActivity,
        myTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
