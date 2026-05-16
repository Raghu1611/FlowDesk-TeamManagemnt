import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUsersAPI, updateUserRoleAPI } from '../../api/user.api';
import { Shield, Mail, Clock, ChevronDown, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const roleColors = {
  admin: 'bg-danger/10 text-danger', manager: 'bg-warning/10 text-warning', employee: 'bg-accent/10 text-accent'
};

const TeamPage = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { const res = await getUsersAPI(); setUsers(res.data); } catch { toast.error('Failed to load team'); }
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRoleAPI(userId, newRole);
      toast.success('Role updated');
      setEditingRole(null);
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role'); }
  };

  const groupedByDept = users.reduce((acc, u) => {
    const dept = u.department || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Team</h1>
          <p className="text-text-secondary text-sm mt-1">{users.length} members across the organization</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-3">
        {['admin', 'manager', 'employee'].map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="flex items-center gap-2.5 px-4 py-2.5 bg-background-surface border border-border rounded-xl shadow-card">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${roleColors[role]}`}>{role}</span>
              <span className="text-lg font-display font-bold text-text-primary tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByDept).map(([dept, members]) => (
            <div key={dept}>
              <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> {dept} <span className="text-text-muted/60">({members.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {members.map((member, i) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="bg-background-surface border border-border rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                          alt={member.name}
                          className="w-10 h-10 rounded-lg border border-border bg-background-base"
                        />
                        {member.isActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-background-surface" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{member.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                          <Mail className="w-3 h-3" /> <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                      {isAdmin && member._id !== currentUser._id ? (
                        <div className="relative">
                          <button
                            onClick={() => setEditingRole(editingRole === member._id ? null : member._id)}
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${roleColors[member.role]} cursor-pointer hover:opacity-80 transition-opacity`}
                          >
                            <Shield className="w-3 h-3" /> {member.role} <ChevronDown className="w-3 h-3" />
                          </button>
                          {editingRole === member._id && (
                            <div className="absolute top-full left-0 mt-1 bg-background-surface border border-border rounded-xl shadow-modal z-10 overflow-hidden min-w-28 animate-fadeIn">
                              {['admin', 'manager', 'employee'].map(r => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(member._id, r)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium capitalize hover:bg-background-hover transition-colors ${r === member.role ? 'text-accent bg-accent/5' : 'text-text-primary'}`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${roleColors[member.role]} flex items-center gap-1`}>
                          <Shield className="w-3 h-3" />{member.role}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock className="w-3 h-3" />
                        {member.isActive ? (
                          <span className="text-success font-semibold">Online</span>
                        ) : (
                          <span>{member.lastSeen ? new Date(member.lastSeen).toLocaleDateString() : 'Never'}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamPage;
