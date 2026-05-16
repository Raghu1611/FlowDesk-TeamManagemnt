import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../features/tasks/tasksSlice';
import { deleteTaskAPI, updateTaskAPI, addCommentAPI, addAttachmentAPI } from '../../api/task.api';
import { resolveFileUrl, resolveDownloadUrl } from '../../api/axios';
import { getUsersAPI } from '../../api/user.api';
import { Clock, MessageSquare, Paperclip, MoreHorizontal, Trash2, Edit3, X, Send, Filter, Plus, Search, SlidersHorizontal, Upload, Loader2, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';

const priorityColors = {
  low: 'text-info bg-info/10', medium: 'text-warning bg-warning/10',
  high: 'text-danger bg-danger/10', critical: 'text-white bg-danger',
};
const statusColors = {
  backlog: 'bg-background-hover text-text-muted', todo: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning', in_review: 'bg-accent/10 text-accent',
  done: 'bg-success/10 text-success'
};
const statusMap = { backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };

const TasksPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector(state => state.tasks);
  const { user } = useSelector(state => state.auth);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [users, setUsers] = useState([]);
  const [attachUploading, setAttachUploading] = useState(false);
  const attachInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchTasks());
    getUsersAPI().then(res => setUsers(res.data)).catch(() => {});
  }, [dispatch]);

  // Re-sync selected task when tasks update
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t._id === selectedTask._id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  const filteredTasks = tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const handleDelete = async (id) => {
    try {
      await deleteTaskAPI(id);
      toast.success('Task deleted');
      if (selectedTask?._id === id) setSelectedTask(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleReassign = async (taskId, newAssignee) => {
    try {
      await updateTaskAPI(taskId, { assignee: newAssignee || null });
      toast.success('Task reassigned');
    } catch { toast.error('Failed to reassign'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskAPI(taskId, { status: newStatus });
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    setCommentLoading(true);
    try {
      const res = await addCommentAPI(selectedTask._id, commentText);
      setSelectedTask(res.data);
      setCommentText('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    setCommentLoading(false);
  };

  const handleAttachUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10 MB');
    try {
      setAttachUploading(true);
      const res = await addAttachmentAPI(selectedTask._id, file);
      setSelectedTask(res.data);
      dispatch(fetchTasks());
      toast.success('File attached');
    } catch { toast.error('Failed to upload file'); }
    finally { setAttachUploading(false); e.target.value = ''; }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Tasks</h1>
          <p className="text-text-secondary text-sm mt-1">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-background-surface border border-border rounded-2xl p-4 shadow-card">
        <div className="relative flex-1 min-w-[200px] max-w-sm group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors duration-200">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text" placeholder="Search by task name..."
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
            className="w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.06)] hover:border-border/80 transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-background-base border border-border rounded-xl px-3 py-1 hover:border-border/80 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="py-1.5 bg-transparent text-sm text-text-primary focus:outline-none cursor-pointer font-medium min-w-[90px]">
              <option value="">All Status</option>
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-background-base border border-border rounded-xl px-3 py-1 hover:border-border/80 transition-colors">
            <Filter className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} className="py-1.5 bg-transparent text-sm text-text-primary focus:outline-none cursor-pointer font-medium min-w-[90px]">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        {(filters.status || filters.priority || filters.search) && (
          <button onClick={() => setFilters({ status: '', priority: '', search: '' })} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-semibold px-3 py-2 rounded-xl hover:bg-accent/5 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`bg-background-surface border border-border rounded-xl shadow-card overflow-hidden flex-1 transition-all ${selectedTask ? 'hidden lg:block' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background-base/50">
                  <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Task</th>
                  <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Priority</th>
                  {isAdminOrManager && <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Assignee</th>}
                  <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && tasks.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-text-muted">Loading tasks...</td></tr>
                ) : filteredTasks.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-text-muted">No tasks found</td></tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id} onClick={() => setSelectedTask(task)} className="hover:bg-background-hover transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary text-sm">{task.title}</div>
                        {task.description && <div className="text-xs text-text-secondary line-clamp-1 mt-0.5 max-w-xs">{task.description}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusColors[task.status]}`}>{statusMap[task.status]}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>{task.priority}</span>
                      </td>
                      {isAdminOrManager && (
                        <td className="py-3 px-4 hidden md:table-cell">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-white font-bold">{task.assignee.name?.charAt(0)}</div>
                              <span className="text-sm text-text-primary">{task.assignee.name}</span>
                            </div>
                          ) : <span className="text-sm text-text-muted">Unassigned</span>}
                        </td>
                      )}
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {task.dueDate ? (
                          <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : <span className="text-xs text-text-muted">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        {(isAdminOrManager || task.reporter?._id === user?._id) && (
                          <button onClick={() => handleDelete(task._id)} className="text-text-muted hover:text-danger p-1 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Detail Drawer */}
        <AnimatePresence>
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-96 bg-background-surface border border-border rounded-xl shadow-card overflow-hidden flex flex-col shrink-0"
            >
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h3 className="font-display font-semibold text-text-primary text-sm truncate flex-1">Task Details</h3>
                <button onClick={() => setSelectedTask(null)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <h2 className="font-semibold text-text-primary text-lg">{selectedTask.title}</h2>
                  {selectedTask.description && <p className="text-sm text-text-secondary mt-2">{selectedTask.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleStatusChange(selectedTask._id, e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 bg-background-base border border-border rounded-lg text-xs focus:outline-none focus:border-accent appearance-none"
                    >
                      {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Priority</label>
                    <span className={`block mt-1 text-xs font-bold uppercase px-2 py-1.5 rounded-lg text-center ${priorityColors[selectedTask.priority]}`}>{selectedTask.priority}</span>
                  </div>
                </div>

                {/* Assignee - visible to all, reassignable by admin/manager */}
                <div>
                  <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Assignee</label>
                  {isAdminOrManager ? (
                    <select
                      value={selectedTask.assignee?._id || ''}
                      onChange={e => handleReassign(selectedTask._id, e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 bg-background-base border border-border rounded-lg text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                    </select>
                  ) : selectedTask.assignee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-white font-bold">{selectedTask.assignee.name?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{selectedTask.assignee.name}</p>
                        <p className="text-[10px] text-text-muted">{selectedTask.assignee.email}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-text-muted mt-1">Unassigned</p>}
                </div>

                {selectedTask.labels?.length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Labels</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedTask.labels.map(l => (
                        <span key={l} className="text-[10px] font-medium px-2 py-1 rounded-md bg-background-hover text-text-secondary">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div>
                  <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachments ({selectedTask.attachments?.length || 0})</label>
                  {selectedTask.attachments?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {selectedTask.attachments.map((a, i) => (
                        <a key={i} href={resolveDownloadUrl(a.url)} download={a.name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-accent hover:underline truncate">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />{a.name}<Download className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      ))}
                    </div>
                  )}
                  <input type="file" ref={attachInputRef} onChange={handleAttachUpload} className="hidden" />
                  <button onClick={() => attachInputRef.current?.click()} disabled={attachUploading}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50">
                    {attachUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {attachUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>

                {/* Comments */}
                <div>
                  <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Comments ({selectedTask.comments?.length || 0})
                  </label>
                  <div className="mt-2 space-y-3 max-h-48 overflow-y-auto">
                    {selectedTask.comments?.map((c, i) => (
                      <div key={i} className="bg-background-base rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-text-primary">{c.user?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-text-muted">{new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-1.5 bg-background-base border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                    />
                    <button type="submit" disabled={commentLoading || !commentText.trim()} className="p-1.5 bg-accent text-white rounded-lg disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateTaskModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} users={users} />
    </div>
  );
};

export default TasksPage;
