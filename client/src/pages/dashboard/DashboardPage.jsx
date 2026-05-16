import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Users, Briefcase, TrendingUp, Activity, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useSelector } from 'react-redux';
import StatsCard from '../../components/analytics/StatsCard';
import TaskCompletionChart from '../../components/analytics/TaskCompletionChart';
import { getDashboardStatsAPI } from '../../api/dashboard.api';
import { Link } from 'react-router-dom';

const priorityBadge = {
  low: 'bg-info/10 text-info',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger',
  critical: 'bg-danger text-white',
};

const statusDot = { todo: 'bg-info', in_progress: 'bg-warning', in_review: 'bg-accent', done: 'bg-success', backlog: 'bg-text-muted' };

const DashboardPage = () => {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStatsAPI().then(res => setStats(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completionRate = stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-64 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 skeleton" />
          <div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">Here's your project overview for today.</p>
        </div>
        <Link to="/tasks" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors">
          View all tasks <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Projects" value={stats?.activeProjects || 0} trend={`${stats?.totalProjects || 0} total`} trendUp={true} icon={Briefcase} color="accent" />
        <StatsCard title="Completed" value={stats?.completedTasks || 0} trend={`${completionRate}% rate`} trendUp={completionRate > 50} icon={CheckCircle2} color="success" />
        <StatsCard title="Overdue" value={stats?.overdueTasks || 0} trend={stats?.overdueTasks > 0 ? 'Needs attention' : 'On track'} trendUp={stats?.overdueTasks === 0} icon={AlertTriangle} color="danger" />
        <StatsCard title="Team Size" value={stats?.totalUsers || 0} trend="Active" trendUp={true} icon={Users} color="info" />
      </div>

      {/* Chart + My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-background-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Task Completion Trend
            </h3>
            <span className="text-xs text-text-muted font-medium">Last 7 days</span>
          </div>
          <div className="h-64 mt-2">
            <TaskCompletionChart data={stats?.dailyCompleted} />
          </div>
        </div>
        
        <div className="bg-background-surface border border-border rounded-xl shadow-card flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-sm font-display font-semibold text-text-primary">My Tasks</h3>
            <span className="text-[10px] font-bold text-text-muted bg-background-hover px-2 py-0.5 rounded-full">{stats?.myTasks?.length || 0}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {stats?.myTasks?.length > 0 ? stats.myTasks.map(task => (
              <div key={task._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-hover transition-colors cursor-pointer group">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${statusDot[task.status] || 'bg-text-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text-primary line-clamp-1 group-hover:text-accent transition-colors">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-px rounded ${priorityBadge[task.priority]}`}>{task.priority}</span>
                    {task.dueDate && (
                      <span className={`text-[10px] ${new Date(task.dueDate) < new Date() ? 'text-danger font-semibold' : 'text-text-muted'}`}>
                        {new Date(task.dueDate) < new Date() ? 'Overdue' : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-text-muted text-sm">No tasks assigned</div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-surface border border-border rounded-xl p-6 shadow-card">
          <h3 className="text-sm font-display font-semibold text-text-primary mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Task Distribution
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Backlog', key: 'backlog', color: 'bg-text-muted' },
              { label: 'To Do', key: 'todo', color: 'bg-info' },
              { label: 'In Progress', key: 'in_progress', color: 'bg-warning' },
              { label: 'In Review', key: 'in_review', color: 'bg-accent' },
              { label: 'Done', key: 'done', color: 'bg-success' },
            ].map(item => {
              const count = stats?.tasksByStatus?.[item.key] || 0;
              const total = stats?.totalTasks || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={item.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-secondary font-medium">{item.label}</span>
                    <span className="text-text-primary font-semibold tabular-nums">{count} <span className="text-text-muted">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-background-surface border border-border rounded-xl shadow-card flex flex-col">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-sm font-display font-semibold text-text-primary">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5 max-h-72">
            {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((log, i) => (
              <div key={log._id || i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-background-hover transition-colors">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-accent">{log.user?.name?.charAt(0) || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary leading-snug">{log.details}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {log.user?.name} · {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-text-muted text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
