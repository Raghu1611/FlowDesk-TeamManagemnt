import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, MessageSquare, BarChart3, Users, Settings, X, Columns3 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { resolveFileUrl } from '../../api/axios';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager', 'employee'] },
  { icon: FolderKanban, label: 'Projects', path: '/projects', roles: ['admin', 'manager'] },
  { icon: CheckSquare, label: 'My Tasks', path: '/tasks', roles: ['admin', 'manager', 'employee'] },
  { icon: Columns3, label: 'Kanban Board', path: '/kanban', roles: ['admin', 'manager', 'employee'] },
  { icon: MessageSquare, label: 'Team Chat', path: '/chat', roles: ['admin', 'manager', 'employee'] },
  { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'manager'] },
  { icon: Users, label: 'Team', path: '/team', roles: ['admin'] },
];

const Sidebar = ({ onClose }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <aside className="w-64 bg-background-surface border-r border-border flex flex-col h-full shrink-0 relative z-50">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-info flex items-center justify-center font-display font-bold text-sm text-white shadow-sm">
            F
          </div>
          <span className="font-display font-bold text-lg text-text-primary tracking-tight">FlowDesk</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background-base/50">
          <div className="w-9 h-9 rounded-lg bg-accent/10 shrink-0 overflow-hidden ring-1 ring-border">
            <img src={user?.avatar ? resolveFileUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-text-primary truncate leading-tight">{user?.name || 'Guest'}</span>
            <span className="text-[11px] text-accent font-medium capitalize">{user?.role || 'visitor'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2">Menu</p>
        {navItems.filter(item => item.roles.includes(user?.role || 'employee')).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent shadow-sm'
                  : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border mt-auto">
        <div className="flex items-center justify-between px-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 px-2 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-hover"
          >
            <Settings className="w-[18px] h-[18px]" />
            Settings
          </NavLink>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
