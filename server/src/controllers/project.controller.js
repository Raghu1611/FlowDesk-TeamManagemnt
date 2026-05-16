const Project = require('../models/Project.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('manager', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      manager: req.user._id
    });
    const created = await project.save();
    await created.populate('manager', 'name email role');
    await created.populate('members', 'name email role');

    // Activity log
    await ActivityLog.create({
      user: req.user._id,
      action: 'project_created',
      entity: 'project',
      entityId: created._id,
      details: `Created project "${created.title}"`
    });

    // Notify members
    if (req.body.members && req.body.members.length > 0) {
      const notifications = req.body.members.map(memberId => ({
        recipient: memberId,
        sender: req.user._id,
        type: 'project_added',
        title: 'Added to Project',
        message: `You have been added to project "${created.title}"`,
        entityType: 'project',
        entityId: created._id
      }));
      await Notification.insertMany(notifications);

      const io = req.app.get('io');
      req.body.members.forEach(memberId => {
        io.to(`user:${memberId}`).emit('notification:new', {
          type: 'project_added',
          title: 'Added to Project',
          message: `You have been added to project "${created.title}"`
        });
      });
    }

    req.app.get('io').emit('project:created', created);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name email role')
      .populate('members', 'name email role');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await ActivityLog.create({
      user: req.user._id,
      action: 'project_updated',
      entity: 'project',
      entityId: project._id,
      details: `Updated project "${project.title}"`
    });

    req.app.get('io').emit('project:updated', project);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await ActivityLog.create({
      user: req.user._id,
      action: 'project_deleted',
      entity: 'project',
      entityId: project._id,
      details: `Deleted project "${project.title}"`
    });

    req.app.get('io').emit('project:deleted', req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
