import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../features/projects/projectsSlice';
import { createProjectAPI, updateProjectAPI, deleteProjectAPI } from '../../api/project.api';
import { getUsersAPI } from '../../api/user.api';
import { Plus, MoreHorizontal, Calendar, Users, X, Loader2, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const priorityColors = {
  low: 'bg-info/10 text-info', medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger', critical: 'bg-danger text-white'
};

const statusColors = {
  active: 'bg-success/10 text-success', completed: 'bg-accent/10 text-accent', archived: 'bg-background-hover text-text-muted'
};

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);
  const { user } = useSelector(state => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', members: [], tags: '' });
  const [menuOpen, setMenuOpen] = useState(null);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    dispatch(fetchProjects());
    getUsersAPI().then(res => setUsers(res.data)).catch(() => {});
  }, [dispatch]);

  const openCreateModal = () => {
    setEditProject(null);
    setForm({ title: '', description: '', priority: 'medium', members: [], tags: '' });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditProject(project);
    setForm({
      title: project.title,
      description: project.description || '',
      priority: project.priority,
      members: project.members?.map(m => m._id) || [],
      tags: project.tags?.join(', ') || ''
    });
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      if (editProject) {
        await updateProjectAPI(editProject._id, payload);
        toast.success('Project updated');
      } else {
        await createProjectAPI(payload);
        toast.success('Project created');
      }
      setShowModal(false);
      dispatch(fetchProjects());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProjectAPI(id);
      toast.success('Project deleted');
      dispatch(fetchProjects());
    } catch (err) {
      toast.error('Failed to delete');
    }
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary text-sm mt-1">Manage and track all team projects.</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {loading && projects.length === 0 ? (
        <div className="py-16 text-center text-text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-background-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted mb-4">No projects yet. Create your first project to get started!</p>
          {canManage && (
            <button onClick={openCreateModal} className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map(project => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background-surface border border-border rounded-xl p-5 shadow-card hover:shadow-cardHover transition-all group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-text-primary text-lg truncate group-hover:text-accent transition-colors">{project.title}</h3>
                    {project.description && <p className="text-sm text-text-secondary line-clamp-2 mt-1">{project.description}</p>}
                  </div>
                  {canManage && (
                    <div className="relative ml-2">
                      <button onClick={() => setMenuOpen(menuOpen === project._id ? null : project._id)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpen === project._id && (
                        <div className="absolute right-0 mt-1 w-36 bg-background-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                          <button onClick={() => openEditModal(project)} className="w-full text-left px-3 py-2 text-sm hover:bg-background-hover flex items-center gap-2 text-text-primary">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleDelete(project._id)} className="w-full text-left px-3 py-2 text-sm hover:bg-danger/10 flex items-center gap-2 text-danger">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusColors[project.status]}`}>{project.status}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${priorityColors[project.priority]}`}>{project.priority}</span>
                  {project.tags?.map(tag => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-1 rounded-md bg-background-hover text-text-secondary">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-text-muted text-xs pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{project.members?.length || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {project.manager && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] text-white font-bold">{project.manager.name?.charAt(0)}</div>
                      <span>{project.manager.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-base/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background-surface border border-border shadow-modal rounded-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-display font-semibold text-text-primary">
                {editProject ? 'Edit Project' : 'Create Project'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Project name" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent h-20 resize-none" placeholder="What is this project about?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent appearance-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Tags</label>
                  <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-3 py-2 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent" placeholder="react, node" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Members</label>
                <div className="max-h-32 overflow-y-auto border border-border rounded-lg bg-background-base p-2 space-y-1">
                  {users.filter(u => u._id !== user?._id).map(u => (
                    <label key={u._id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-background-hover rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.members.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked) setForm({...form, members: [...form.members, u._id]});
                          else setForm({...form, members: form.members.filter(id => id !== u._id)});
                        }}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-text-primary">{u.name}</span>
                      <span className="text-[10px] text-text-muted capitalize ml-auto">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
