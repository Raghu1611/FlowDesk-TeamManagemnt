const ActivityLog = require('../models/ActivityLog.model');

const getActivityLogs = async (req, res) => {
  try {
    const { entity, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getActivityLogs };
