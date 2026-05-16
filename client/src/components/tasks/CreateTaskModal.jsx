import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { createTaskAPI } from '../../api/task.api';
import { getUsersAPI } from '../../api/user.api';
import { getProjectsAPI } from '../../api/project.api';
import toast from 'react-hot-toast';

const CreateTaskModal = ({ isOpen, onClose, users: propUsers }) => {
  const { user: currentUser } = useSelector(state => state.auth);
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(propUsers || []);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    assignee: '', project: '', dueDate: '', labels: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (!propUsers?.length) getUsersAPI().then(r => setUsers(r.data)).catch(() => {});
      getProjectsAPI().then(r => setProjects(r.data)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (propUsers?.length) setUsers(propUsers);
  }, [propUsers]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Task title is required');
    try {
      setLoading(true);
      const payload = {
        ...formData,
        assignee: isAdminOrManager ? (formData.assignee || undefined) : currentUser?._id,
        project: formData.project || undefined,
        dueDate: formData.dueDate || undefined,
        labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : []
      };
      await createTaskAPI(payload);
      toast.success('Task created successfully');
      setFormData({ title: '', description: '', priority: 'medium', status: 'todo', assignee: '', project: '', dueDate: '', labels: '' });
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background-surface border border-border shadow-modal rounded-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-lg font-display font-semibold text-text-primary">Create New Task</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Task Title *</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="e.g., Update landing page copy" autoFocus />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent h-20 resize-none" placeholder="Add more details..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent appearance-none">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent appearance-none">
                <option value="backlog">Backlog</option><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="in_review">In Review</option><option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Assignee</label>
              {isAdminOrManager ? (
                <select name="assignee" value={formData.assignee} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent appearance-none">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm text-text-muted">
                  {currentUser?.name} (you)
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Project</label>
              <select name="project" value={formData.project} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent appearance-none">
                <option value="">No project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Due Date</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Labels</label>
              <input name="labels" value={formData.labels} onChange={handleChange} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent" placeholder="frontend, bug" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
