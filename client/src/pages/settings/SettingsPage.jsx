import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, Building2, FileText, Lock, Eye, EyeOff, Camera, Shield, Save, Loader2 } from 'lucide-react';
import { updateProfileAPI, changePasswordAPI, uploadAvatarAPI } from '../../api/user.api';
import { resolveFileUrl } from '../../api/axios';
import { updateUser } from '../../features/auth/authSlice';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user } = useSelector(state => state.auth);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    department: user?.department || 'Engineering',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error('Name is required');
    try {
      setSaving(true);
      const res = await updateProfileAPI(profile);
      dispatch(updateUser(res.data));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    try {
      setSaving(true);
      await changePasswordAPI({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    try {
      setUploadingAvatar(true);
      const res = await uploadAvatarAPI(file);
      dispatch(updateUser(res.data));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally { setUploadingAvatar(false); }
  };

  const avatarUrl = user?.avatar ? resolveFileUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Preferences' },
  ];

  const inputClass = 'w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors';
  const labelClass = 'block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background-surface border border-border rounded-xl p-1 shadow-card">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === t.id
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-background-surface border border-border rounded-xl shadow-card overflow-hidden">
          {/* Avatar Header */}
          <div className="bg-gradient-to-r from-accent/10 via-info/5 to-success/10 px-6 py-8 flex items-center gap-5 border-b border-border">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl ring-4 ring-background-surface shadow-cardHover object-cover"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-text-primary">{user?.name}</h2>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/10 text-accent uppercase tracking-wider">
                  <Shield className="w-3 h-3" /> {user?.role}
                </span>
                <span className="text-[10px] text-text-muted">{user?.department}</span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={inputClass} placeholder="Your name" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={user?.email || ''} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className={inputClass} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} className={inputClass}>
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Product</option>
                    <option>Sales</option>
                    <option>HR</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors resize-none h-20"
                  placeholder="A short bio about yourself..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="bg-background-surface border border-border rounded-xl shadow-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" /> Change Password
            </h3>
            <p className="text-xs text-text-muted mt-1">Ensure your account stays secure with a strong password</p>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {tab === 'preferences' && (
        <div className="bg-background-surface border border-border rounded-xl shadow-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-display font-semibold text-text-primary">Appearance</h3>
            <p className="text-xs text-text-muted mt-1">Customize how FlowDesk looks on your device</p>
          </div>
          <div className="p-6 space-y-5">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Dark Mode</p>
                <p className="text-xs text-text-muted mt-0.5">Switch between light and dark themes</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-accent' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Account Info */}
            <div className="border-t border-border pt-5">
              <h4 className="text-sm font-medium text-text-primary mb-3">Account Information</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-background-base rounded-lg p-3">
                  <p className="text-text-muted">Role</p>
                  <p className="font-semibold text-text-primary capitalize mt-0.5">{user?.role}</p>
                </div>
                <div className="bg-background-base rounded-lg p-3">
                  <p className="text-text-muted">Department</p>
                  <p className="font-semibold text-text-primary mt-0.5">{user?.department}</p>
                </div>
                <div className="bg-background-base rounded-lg p-3">
                  <p className="text-text-muted">Member Since</p>
                  <p className="font-semibold text-text-primary mt-0.5">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="bg-background-base rounded-lg p-3">
                  <p className="text-text-muted">Status</p>
                  <p className="font-semibold text-success mt-0.5">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
