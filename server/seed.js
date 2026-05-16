require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const Project = require('./src/models/Project.model');
const Task = require('./src/models/Task.model');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create users
    const users = [
      { name: 'Super Admin', email: 'admin@flowdesk.com', password: 'Admin@123', role: 'admin', department: 'Management' },
      { name: 'Sarah Manager', email: 'manager@flowdesk.com', password: 'Manager@123', role: 'manager', department: 'Engineering' },
      { name: 'John Developer', email: 'john@flowdesk.com', password: 'Employee@123', role: 'employee', department: 'Engineering' },
      { name: 'Emily Designer', email: 'emily@flowdesk.com', password: 'Employee@123', role: 'employee', department: 'Design' },
      { name: 'Mike Tester', email: 'mike@flowdesk.com', password: 'Employee@123', role: 'employee', department: 'QA' },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        createdUsers.push(existing);
        console.log(`User ${userData.email} already exists`);
      } else {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`Created user: ${userData.email}`);
      }
    }

    const [admin, manager, john, emily, mike] = createdUsers;

    // Create projects
    const projectsData = [
      { title: 'FlowDesk Platform', description: 'Main project management platform development', status: 'active', manager: manager._id, members: [john._id, emily._id, mike._id], priority: 'high', tags: ['fullstack', 'react', 'node'] },
      { title: 'Mobile App Redesign', description: 'Redesign the mobile app for better UX', status: 'active', manager: manager._id, members: [emily._id, john._id], priority: 'medium', tags: ['mobile', 'design', 'ux'] },
      { title: 'API Documentation', description: 'Complete API docs with Swagger', status: 'active', manager: admin._id, members: [john._id, mike._id], priority: 'low', tags: ['docs', 'api'] },
    ];

    const existingProjects = await Project.countDocuments();
    let projects = [];
    if (existingProjects === 0) {
      projects = await Project.insertMany(projectsData);
      console.log(`Created ${projects.length} projects`);
    } else {
      projects = await Project.find({});
      console.log('Projects already exist');
    }

    // Create tasks
    const existingTasks = await Task.countDocuments();
    if (existingTasks === 0) {
      const tasksData = [
        { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for auto-deployment', project: projects[0]?._id, assignee: john._id, reporter: manager._id, status: 'done', priority: 'high', labels: ['devops'], dueDate: new Date('2026-05-20') },
        { title: 'Design dashboard wireframes', description: 'Create Figma wireframes for the new dashboard', project: projects[0]?._id, assignee: emily._id, reporter: manager._id, status: 'done', priority: 'medium', labels: ['design'], dueDate: new Date('2026-05-18') },
        { title: 'Implement user authentication', description: 'JWT based auth with role management', project: projects[0]?._id, assignee: john._id, reporter: manager._id, status: 'in_progress', priority: 'critical', labels: ['backend', 'security'], dueDate: new Date('2026-05-25') },
        { title: 'Create Kanban board component', description: 'Drag and drop Kanban with real-time updates', project: projects[0]?._id, assignee: john._id, reporter: manager._id, status: 'in_progress', priority: 'high', labels: ['frontend'], dueDate: new Date('2026-05-22') },
        { title: 'Write unit tests for API', description: 'Jest + Supertest for all endpoints', project: projects[0]?._id, assignee: mike._id, reporter: manager._id, status: 'todo', priority: 'medium', labels: ['testing'], dueDate: new Date('2026-05-30') },
        { title: 'Socket.IO chat integration', description: 'Real-time messaging with rooms', project: projects[0]?._id, assignee: john._id, reporter: manager._id, status: 'in_review', priority: 'high', labels: ['backend', 'realtime'], dueDate: new Date('2026-05-24') },
        { title: 'Mobile responsive layout', description: 'Ensure all pages work on mobile devices', project: projects[1]?._id, assignee: emily._id, reporter: manager._id, status: 'todo', priority: 'high', labels: ['frontend', 'mobile'], dueDate: new Date('2026-06-01') },
        { title: 'API rate limiting', description: 'Implement proper rate limiting middleware', project: projects[2]?._id, assignee: john._id, reporter: admin._id, status: 'done', priority: 'medium', labels: ['backend', 'security'], dueDate: new Date('2026-05-15') },
        { title: 'Dark mode polish', description: 'Fix contrast issues in dark mode', project: projects[0]?._id, assignee: emily._id, reporter: manager._id, status: 'todo', priority: 'low', labels: ['design', 'ux'], dueDate: new Date('2026-06-05') },
        { title: 'Database indexing', description: 'Add proper indexes for performance', project: projects[0]?._id, assignee: john._id, reporter: admin._id, status: 'backlog', priority: 'medium', labels: ['backend', 'performance'], dueDate: new Date('2026-06-10') },
        { title: 'File upload to Cloudinary', description: 'Implement file attachments for tasks', project: projects[0]?._id, assignee: john._id, reporter: manager._id, status: 'in_progress', priority: 'medium', labels: ['backend'], dueDate: new Date('2026-05-28') },
        { title: 'Analytics dashboard charts', description: 'Recharts integration for productivity data', project: projects[0]?._id, assignee: emily._id, reporter: manager._id, status: 'in_review', priority: 'medium', labels: ['frontend', 'analytics'], dueDate: new Date('2026-05-26') },
      ];
      await Task.insertMany(tasksData);
      console.log(`Created ${tasksData.length} tasks`);
    } else {
      console.log('Tasks already exist');
    }

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@flowdesk.com / Admin@123');
    console.log('Manager:  manager@flowdesk.com / Manager@123');
    console.log('Employee: john@flowdesk.com / Employee@123');
    console.log('Employee: emily@flowdesk.com / Employee@123');
    console.log('Employee: mike@flowdesk.com / Employee@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedData();
