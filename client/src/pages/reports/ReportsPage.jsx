import { useEffect, useState } from 'react';
import { getActivityLogsAPI } from '../../api/activity.api';
import { getDashboardStatsAPI } from '../../api/dashboard.api';
import { Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, FileText } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const actionIcons = {
  task_created: '📝', task_updated: '✏️', task_deleted: '🗑️', task_assigned: '👤',
  task_status_changed: '🔄', task_comment_added: '💬', task_attachment_added: '📎',
  project_created: '📁', project_updated: '📂', project_deleted: '🗂️',
  user_registered: '👋', user_role_changed: '🛡️', message_sent: '💬'
};

const ReportsPage = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const textColor = theme === 'dark' ? '#a1a1aa' : '#4b5271';
  const gridColor = theme === 'dark' ? '#27272a' : '#e3e5ef';

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          getActivityLogsAPI({ entity: filter || undefined, page, limit: 20 }),
          getDashboardStatsAPI()
        ]);
        setLogs(logsRes.data);
        setPagination(logsRes.pagination);
        setStats(statsRes.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [filter, page]);

  const priorityData = stats ? Object.entries(stats.tasksByPriority || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  })) : [];

  const statusData = stats ? Object.entries(stats.tasksByStatus || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value
  })) : [];

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#38bdf8'];
  const completionRate = stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Reports & Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Track productivity, activity, and team performance.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: FileText, color: 'text-accent bg-accent/10' },
          { label: 'Completed', value: stats?.completedTasks || 0, icon: CheckCircle2, color: 'text-success bg-success/10' },
          { label: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertCircle, color: 'text-danger bg-danger/10' },
          { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: 'text-accent bg-accent/10' },
        ].map((item, i) => (
          <div key={i} className="bg-background-surface border border-border rounded-xl p-4 flex items-center gap-3 shadow-card">
            <div className={`p-2.5 rounded-lg ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-xl font-display font-bold text-text-primary tabular-nums">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task Status Pie */}
        <div className="bg-background-surface border border-border rounded-xl p-6 shadow-card">
          <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Tasks by Status</h3>
          {statusData.length > 0 ? (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" stroke="none" paddingAngle={2}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {statusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-text-secondary flex-1">{item.name}</span>
                    <span className="text-xs font-bold text-text-primary tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-56 flex items-center justify-center text-text-muted text-sm">No data</div>}
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-background-surface border border-border rounded-xl p-6 shadow-card">
          <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-primary)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-56 flex items-center justify-center text-text-muted text-sm">No data</div>}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-background-surface border border-border rounded-xl shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Activity Log
          </h3>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-background-base border border-border rounded-lg text-xs focus:outline-none focus:border-accent"
          >
            <option value="">All</option>
            <option value="task">Tasks</option>
            <option value="project">Projects</option>
            <option value="user">Users</option>
          </select>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="py-12 text-center text-text-muted text-sm">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">No activity logs found</div>
          ) : (
            logs.map((log, i) => (
              <div key={log._id || i} className="flex items-start gap-3 px-5 py-3 hover:bg-background-hover transition-colors">
                <div className="text-base shrink-0 mt-0.5">{actionIcons[log.action] || '📋'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary leading-snug">{log.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-text-secondary">{log.user?.name || 'System'}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-background-hover text-text-muted capitalize">{log.entity}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-[11px] text-text-muted tabular-nums">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs font-medium bg-background-base border border-border rounded-lg disabled:opacity-40 hover:bg-background-hover transition-colors"
              >Previous</button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs font-medium bg-background-base border border-border rounded-lg disabled:opacity-40 hover:bg-background-hover transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
