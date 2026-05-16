const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  department: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  project: z.string().optional(),
  assignee: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  labels: z.array(z.string()).optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  project: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().min(0).optional(),
  loggedHours: z.number().min(0).optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional()
});

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  members: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional()
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  members: z.array(z.string()).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional()
});

const addCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(1000)
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'employee'])
});

// Middleware factory
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const messages = error.errors?.map(e => e.message) || [error.message];
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }
};

module.exports = {
  registerSchema, loginSchema,
  createTaskSchema, updateTaskSchema,
  createProjectSchema, updateProjectSchema,
  addCommentSchema, updateRoleSchema,
  validate
};
