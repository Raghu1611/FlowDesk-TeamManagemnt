import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../features/projects/projectsSlice';
import { createProjectAPI, updateProjectAPI, deleteProjectAPI } from '../../api/project.api';
import { getUsersAPI } from '../../api/user.api';
import { Plus, MoreHorizontal, Calendar, Users, X, Loader2, Trash2, Edit3, FolderKanban, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    dispatch(fetchProjects());
    getUsersAPI().then(res => setUsers(res.data)).catch(() => {});
  }, [dispatch]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
    setDeleting(true);
    try {
      await deleteProjectAPI(id);
      toast.success('Project deleted successfully');
      dispatch(fetchProjects());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
    setDeleting(false);
    setConfirmDelete(null);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-accent" /> Projects
          </h1>
          <p className="text-text-secondary text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} — Manage and track all team projects.</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {loading && projects.length === 0 ? (
        <div className="py-20 text-center text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-accent" />
          <p className="text-sm">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-background-surface border border-border rounded-2xl p-16 text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
          <p className="text-text-muted mb-4">No projects yet. Create your first project to get started!</p>
          {canManage && (
            <button onClick={openCreateModal} className="bg-accent text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent-hover transition-colors">
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="bg-background-surface border border-border rounded-2xl shadow-card hover:shadow-cardHover hover:border-accent/20 transition-all duration-200 group relative overflow-hidden"
              >
                {/* Top color accent bar */}
                <div className={`h-1 w-full ${project.status === 'active' ? 'bg-success' : project.status === 'completed' ? 'bg-accent' : 'bg-text-muted/30'}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-text-primary text-base truncate group-hover:text-accent transition-colors flex items-center gap-1.5">
                        {project.title}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                      </h3>
                      {project.description && <p className="text-sm text-text-secondary line-clamp-2 mt-1.5 leading-relaxed">{project.description}</p>}
                    </div>
                    {canManage && (
                      <div className="relative ml-3">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project._id ? null : project._id); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen === project._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-background-surface border border-border rounded-xl shadow-modal z-10 overflow-hidden py-1">
                            <button onClick={() => openEditModal(project)} className="w-full text-left px-3 py-2.5 text-sm hover:bg-background-hover flex items-center gap-2.5 text-text-primary transition-colors">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { setConfirmDelete(project); setMenuOpen(null); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-danger/5 flex items-center gap-2.5 text-danger transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusColors[project.status]}`}>{project.status}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${priorityColors[project.priority]}`}>{project.priority}</span>
                    {project.tags?.map(tag => (
                      <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-background-hover text-text-secondary">{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-text-muted text-xs pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium">{project.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {project.manager && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-[9px] text-white font-bold shadow-sm">{project.manager.name?.charAt(0)}</div>
                        <span className="font-medium">{project.manager.name}</span>
                      </div>
                    )}
                  </div>
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
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3.5 py-2.5 bg-background-base border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" placeholder="Project name" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3.5 py-2.5 bg-background-base border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 h-20 resize-none transition-all" placeholder="What is this project about?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3.5 py-2.5 bg-background-base border border-border rounded-xl text-sm focus:outline-none focus:border-accent transition-all">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Tags</label>
                  <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-3.5 py-2.5 bg-background-base border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" placeholder="react, node" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Members</label>
                <div className="max-h-36 overflow-y-auto border border-border rounded-xl bg-background-base p-2 space-y-0.5">
                  {users.filter(u => u._id !== user?._id).map(u => (
                    <label key={u._id} className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-background-hover rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={form.members.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked) setForm({...form, members: [...form.members, u._id]});
                          else setForm({...form, members: form.members.filter(id => id !== u._id)});
                        }}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">{u.name?.charAt(0).toUpperCase()}</div>
                      <span className="text-sm text-text-primary font-medium flex-1">{u.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-danger/10 text-danger' : u.role === 'manager' ? 'bg-accent/10 text-accent' : 'bg-background-hover text-text-muted'}`}>{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary bg-background-base border border-border rounded-xl hover:bg-background-hover transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-base/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-surface border border-border shadow-modal rounded-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-danger" />
                </div>
                <h3 className="text-lg font-display font-bold text-text-primary mb-2">Delete Project</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary">{confirmDelete.title}</span>? This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="flex gap-3 p-4 border-t border-border bg-background-base/50">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-background-surface border border-border rounded-xl hover:bg-background-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete._id)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-danger/90 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;
