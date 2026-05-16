const Task = require('../models/Task.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');

const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, project, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (project) filter.project = project;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Employees can only see tasks assigned to them or reported by them
    if (req.user.role === 'employee') {
      const roleFilter = { $or: [{ assignee: req.user._id }, { reporter: req.user._id }] };
      if (filter.$or) {
        // Merge search $or with role $or using $and
        const searchOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: searchOr }, roleFilter];
      } else {
        Object.assign(filter, roleFilter);
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email role')
      .populate('reporter', 'name email role')
      .populate('project', 'title')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email role')
      .populate('reporter', 'name email role')
      .populate('project', 'title')
      .populate('comments.user', 'name email');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const task = new Task({ ...req.body, reporter: req.user._id });
    const createdTask = await task.save();
    await createdTask.populate('assignee', 'name email role');
    await createdTask.populate('reporter', 'name email role');
    await createdTask.populate('project', 'title');

    await ActivityLog.create({
      user: req.user._id, action: 'task_created', entity: 'task',
      entityId: createdTask._id, details: `Created task "${createdTask.title}"`
    });

    if (req.body.assignee && req.body.assignee !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.body.assignee, sender: req.user._id,
        type: 'task_assigned', title: 'New Task Assigned',
        message: `You have been assigned to "${createdTask.title}"`,
        entityType: 'task', entityId: createdTask._id
      });
      req.app.get('io').to(`user:${req.body.assignee}`).emit('notification:new', {
        type: 'task_assigned', title: 'New Task Assigned',
        message: `You have been assigned to "${createdTask.title}"`
      });
    }

    req.app.get('io').emit('task:created', createdTask);
    res.status(201).json({ success: true, data: createdTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'name email role')
      .populate('reporter', 'name email role')
      .populate('project', 'title')
      .populate('comments.user', 'name email');

    let action = 'task_updated';
    let details = `Updated task "${task.title}"`;
    if (req.body.status && req.body.status !== oldTask.status) {
      action = 'task_status_changed';
      details = `Changed "${task.title}" from ${oldTask.status} to ${req.body.status}`;
    }
    if (req.body.assignee && req.body.assignee !== oldTask.assignee?.toString()) {
      action = 'task_assigned';
      details = `Reassigned task "${task.title}"`;
      if (req.body.assignee !== req.user._id.toString()) {
        await Notification.create({
          recipient: req.body.assignee, sender: req.user._id,
          type: 'task_assigned', title: 'Task Assigned to You',
          message: `You have been assigned to "${task.title}"`,
          entityType: 'task', entityId: task._id
        });
        req.app.get('io').to(`user:${req.body.assignee}`).emit('notification:new', {
          type: 'task_assigned', title: 'Task Assigned to You',
          message: `You have been assigned to "${task.title}"`
        });
      }
    }

    await ActivityLog.create({ user: req.user._id, action, entity: 'task', entityId: task._id, details });
    req.app.get('io').emit('task:updated', task);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only admin/manager or the reporter can delete
    if (req.user.role === 'employee' && task.reporter?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id, action: 'task_deleted', entity: 'task',
      entityId: task._id, details: `Deleted task "${task.title}"`
    });

    req.app.get('io').emit('task:deleted', req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ user: req.user._id, text });
    await task.save();
    await task.populate('assignee', 'name email role');
    await task.populate('reporter', 'name email role');
    await task.populate('comments.user', 'name email');

    await ActivityLog.create({
      user: req.user._id, action: 'task_comment_added', entity: 'task',
      entityId: task._id, details: `Commented on "${task.title}"`
    });

    const notifyUsers = new Set();
    if (task.assignee?._id && task.assignee._id.toString() !== req.user._id.toString()) {
      notifyUsers.add(task.assignee._id.toString());
    }
    if (task.reporter?._id && task.reporter._id.toString() !== req.user._id.toString()) {
      notifyUsers.add(task.reporter._id.toString());
    }
    const io = req.app.get('io');
    for (const userId of notifyUsers) {
      await Notification.create({
        recipient: userId, sender: req.user._id, type: 'task_comment',
        title: 'New Comment', message: `${req.user.name} commented on "${task.title}"`,
        entityType: 'task', entityId: task._id
      });
      io.to(`user:${userId}`).emit('notification:new', {
        type: 'task_comment', title: 'New Comment',
        message: `${req.user.name} commented on "${task.title}"`
      });
    }

    io.emit('task:updated', task);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileUrl = req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
    task.attachments.push({
      url: fileUrl, name: req.file.originalname,
      size: req.file.size, type: req.file.mimetype
    });
    await task.save();
    await task.populate('assignee', 'name email role');
    await task.populate('reporter', 'name email role');
    await task.populate('comments.user', 'name email');

    await ActivityLog.create({
      user: req.user._id, action: 'task_attachment_added', entity: 'task',
      entityId: task._id, details: `Added attachment to "${task.title}"`
    });

    req.app.get('io').emit('task:updated', task);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, addComment, addAttachment };
