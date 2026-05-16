import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, LogOut, Menu, Check, ChevronDown, X, CheckSquare, FolderKanban, User, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { clearUnread } from '../../features/notifications/notificationsSlice';
import { markAllNotificationsReadAPI } from '../../api/notification.api';
import { getTasksAPI } from '../../api/task.api';
import { resolveFileUrl } from '../../api/axios';
import { getProjectsAPI } from '../../api/project.api';
import { getUsersAPI } from '../../api/user.api';

const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target)) setShowSearch(false);
    };
    if (showSearch) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearch]);

  // Search logic
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        getTasksAPI(), getProjectsAPI(), getUsersAPI()
      ]);
      const q = query.toLowerCase();
      const results = [];
      (tasksRes.data || []).filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
        .slice(0, 5).forEach(t => results.push({ type: 'task', id: t._id, title: t.title, sub: t.status?.replace('_', ' '), icon: 'task' }));
      (projectsRes.data || []).filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        .slice(0, 4).forEach(p => results.push({ type: 'project', id: p._id, title: p.title, sub: p.status, icon: 'project' }));
      (usersRes.data || []).filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q))
        .slice(0, 4).forEach(u => results.push({ type: 'user', id: u._id, title: u.name, sub: `${u.role} · ${u.email}`, icon: 'user' }));
      setSearchResults(results);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleResultClick = (result) => {
    setShowSearch(false);
    setSearchQuery('');
    if (result.type === 'task') navigate('/tasks');
    else if (result.type === 'project') navigate('/projects');
    else if (result.type === 'user') navigate('/team');
  };

  const handleLogout = () => dispatch(logout());

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsReadAPI(); dispatch(clearUnread()); } catch {}
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <header className="h-14 glass border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center flex-1 max-w-xl gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-background-hover transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative group w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors duration-200">
            <Search className="h-4 w-4" />
          </div>
          <button
            onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
            className="block w-full pl-10 pr-16 py-2 border border-border rounded-xl text-sm bg-background-base/80 backdrop-blur-sm text-text-muted text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all duration-200 hover:border-border/80 hover:bg-background-base"
          >
            Search tasks, projects, people...
          </button>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 pointer-events-none">
            <kbd className="h-5 items-center gap-0.5 rounded-md border border-border bg-background-hover/80 px-1.5 font-mono text-[10px] font-medium text-text-muted inline-flex">
              Ctrl
            </kbd>
            <kbd className="h-5 items-center gap-0.5 rounded-md border border-border bg-background-hover/80 px-1.5 font-mono text-[10px] font-medium text-text-muted inline-flex">
              K
            </kbd>
          </div>
        </div>
      </div>
      
      <div className="ml-4 flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-danger rounded-full ring-2 ring-background-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-background-surface border border-border rounded-xl shadow-modal overflow-hidden z-50 animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-display font-semibold text-text-primary text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-accent hover:text-accent-hover font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-text-muted text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n, i) => (
                    <div key={n._id || i} className={`px-4 py-3 hover:bg-background-hover transition-colors ${!n.read ? 'bg-accent/[0.03]' : ''}`}>
                      <div className="flex items-start gap-2">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-text-primary font-medium leading-snug">{n.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{n.message}</p>
                        </div>
                        {n.createdAt && <span className="text-[10px] text-text-muted shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1.5 hidden sm:block" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-danger hover:bg-danger/5 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <div className="flex items-center gap-2 pl-1">
            <img src={user?.avatar ? resolveFileUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt="Profile" className="w-8 h-8 rounded-lg border border-border bg-background-base" />
            <div className="text-right hidden md:block">
              <p className="text-[13px] font-semibold text-text-primary leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted font-medium capitalize">{user?.role || 'employee'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Command Palette — rendered via portal to avoid header stacking context */}
      {showSearch && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div ref={searchModalRef} className="w-full max-w-lg bg-background-surface border border-border rounded-2xl shadow-modal overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks, projects, people..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
              />
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />}
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1 text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className="py-10 text-center text-text-muted text-sm">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Type to search across tasks, projects &amp; people
                </div>
              ) : searchResults.length === 0 && !searchLoading ? (
                <div className="py-10 text-center text-text-muted text-sm">No results for "{searchQuery}"</div>
              ) : (
                <div className="py-2">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.type}-${r.id}-${i}`}
                      onClick={() => handleResultClick(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-background-hover transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${r.type === 'task' ? 'bg-accent/10 text-accent' : r.type === 'project' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {r.type === 'task' ? <CheckSquare className="w-4 h-4" /> : r.type === 'project' ? <FolderKanban className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                        <p className="text-xs text-text-muted capitalize truncate">{r.sub}</p>
                      </div>
                      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background-hover border border-border rounded font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background-hover border border-border rounded font-mono">↵</kbd> Open</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background-hover border border-border rounded font-mono">Esc</kbd> Close</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
