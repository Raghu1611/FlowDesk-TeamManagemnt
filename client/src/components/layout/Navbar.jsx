import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, Menu, Check, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { clearUnread } from '../../features/notifications/notificationsSlice';
import { markAllNotificationsReadAPI } from '../../api/notification.api';

const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        
        <div className="relative group w-full max-w-sm hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm bg-background-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            placeholder="Search..."
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background-hover px-1.5 font-mono text-[10px] font-medium text-text-muted">
            ⌘K
          </kbd>
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
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt="Profile" className="w-8 h-8 rounded-lg border border-border bg-background-base" />
            <div className="text-right hidden md:block">
              <p className="text-[13px] font-semibold text-text-primary leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted font-medium capitalize">{user?.role || 'employee'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
