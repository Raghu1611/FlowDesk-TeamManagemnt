import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Send, Hash, Lock, Megaphone, FolderKanban, Smile, Pencil, Trash2, MoreVertical, X, Check, MessageCircle, Users, Circle, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { SocketContext } from '../../App';
import { getMessagesAPI, getRoomsAPI, getChatUsersAPI } from '../../api/message.api';

const channelIcons = {
  announcements: Megaphone,
  management: Lock,
  leadership: Lock,
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '🙌'];

const ChatPage = () => {
  const { user } = useSelector(state => state.auth);
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('general');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [emojiPickerId, setEmojiPickerId] = useState(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [showNewDm, setShowNewDm] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Helper: generate DM room id (same as backend, sorted)
  const getDmRoomId = (id1, id2) => {
    const sorted = [id1, id2].sort();
    return `dm:${sorted[0]}_${sorted[1]}`;
  };

  // Format last seen
  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setMenuOpenId(null); setEmojiPickerId(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Load rooms
  useEffect(() => {
    getRoomsAPI().then(res => {
      setRooms(res.data);
      if (res.data.length > 0 && !res.data.find(r => r.name === activeRoom)) {
        setActiveRoom(res.data[0].name);
      }
    }).catch(() => {});

    // Load chat users for DM
    getChatUsersAPI().then(res => setChatUsers(res.data)).catch(() => {});
  }, []);

  // Online users tracking
  useEffect(() => {
    if (!socket) return;
    const handleOnline = (users) => {
      setOnlineUserIds(users.map(u => u.userId));
    };
    socket.on('users:online', handleOnline);

    // Listen for new DM notifications to refresh rooms
    const handleDmNotif = () => {
      getRoomsAPI().then(res => setRooms(res.data)).catch(() => {});
    };
    socket.on('dm:new_message', handleDmNotif);

    return () => {
      socket.off('users:online', handleOnline);
      socket.off('dm:new_message', handleDmNotif);
    };
  }, [socket]);

  // Load messages for active room
  useEffect(() => {
    const loadMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await getMessagesAPI(activeRoom);
        setMessages(res.data);
      } catch { setMessages([]); }
      setLoadingMsgs(false);
    };
    loadMessages();

    if (socket) {
      socket.emit('join_room', activeRoom);
      return () => { socket.emit('leave_room', activeRoom); };
    }
  }, [activeRoom, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      if (data.room === activeRoom) setMessages(prev => [...prev, data]);
    };
    const handleEdited = (data) => {
      if (data.room === activeRoom) setMessages(prev => prev.map(m => m._id === data._id ? { ...m, content: data.content, edited: true, editedAt: data.editedAt } : m));
    };
    const handleDeletedForMe = (data) => {
      if (data.room === activeRoom) setMessages(prev => prev.filter(m => m._id !== data._id));
    };
    const handleDeletedForEveryone = (data) => {
      if (data.room === activeRoom) setMessages(prev => prev.filter(m => m._id !== data._id));
    };
    const handleReactionUpdated = (data) => {
      if (data.room === activeRoom) setMessages(prev => prev.map(m => m._id === data._id ? { ...m, reactions: data.reactions } : m));
    };
    const handleTypingStart = (data) => {
      if (data.room === activeRoom && data.user !== user?.name) setTypingUsers(prev => prev.includes(data.user) ? prev : [...prev, data.user]);
    };
    const handleTypingStop = (data) => {
      if (data.room === activeRoom) setTypingUsers(prev => prev.filter(u => u !== data.user));
    };

    socket.on('receive_message', handleMessage);
    socket.on('message:edited', handleEdited);
    socket.on('message:deleted_for_me', handleDeletedForMe);
    socket.on('message:deleted_for_everyone', handleDeletedForEveryone);
    socket.on('message:reaction_updated', handleReactionUpdated);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('message:edited', handleEdited);
      socket.off('message:deleted_for_me', handleDeletedForMe);
      socket.off('message:deleted_for_everyone', handleDeletedForEveryone);
      socket.off('message:reaction_updated', handleReactionUpdated);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, activeRoom, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;
    socket.emit('send_message', { room: activeRoom, content: inputValue });
    socket.emit('typing_stop', { room: activeRoom });
    setInputValue('');
    // Refresh rooms list after DM to update sidebar
    if (activeRoom.startsWith('dm:')) {
      setTimeout(() => getRoomsAPI().then(res => setRooms(res.data)).catch(() => {}), 500);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (socket) {
      socket.emit('typing_start', { room: activeRoom });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit('typing_stop', { room: activeRoom }), 2000);
    }
  };

  const switchRoom = (room) => {
    if (room === activeRoom) return;
    if (socket) socket.emit('leave_room', activeRoom);
    setActiveRoom(room);
    setMessages([]);
    setTypingUsers([]);
    setMobileSidebar(false);
  };

  const canEdit = useCallback((msg) => {
    const senderId = typeof msg.sender === 'object' ? msg.sender?._id : null;
    if (senderId !== user?._id) return false;
    return Date.now() - new Date(msg.createdAt).getTime() < 2 * 60 * 1000;
  }, [user]);

  const handleEdit = (msg) => { setEditingId(msg._id); setEditContent(msg.content); setMenuOpenId(null); };

  const submitEdit = () => {
    if (!editContent.trim() || !socket) return;
    socket.emit('edit_message', { messageId: editingId, content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteForMe = (msgId) => { socket?.emit('delete_for_me', { messageId: msgId }); setMenuOpenId(null); };
  const handleDeleteForEveryone = (msgId) => { socket?.emit('delete_for_everyone', { messageId: msgId }); setMenuOpenId(null); };
  const handleReaction = (msgId, emoji) => { socket?.emit('toggle_reaction', { messageId: msgId, emoji }); setEmojiPickerId(null); };

  const startDm = (otherUser) => {
    const roomId = getDmRoomId(user._id, otherUser._id);
    // Add to rooms if not already there
    setRooms(prev => {
      if (prev.find(r => r.name === roomId)) return prev;
      return [...prev, {
        name: roomId,
        label: otherUser.name,
        type: 'dm',
        otherUser: { ...otherUser, isActive: onlineUserIds.includes(otherUser._id) }
      }];
    });
    switchRoom(roomId);
    setShowNewDm(false);
  };

  const isUserOnline = (userId) => onlineUserIds.includes(userId);

  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const getSenderName = (msg) => typeof msg.sender === 'object' ? msg.sender?.name || 'Unknown' : msg.sender || 'Unknown';
  const getSenderRole = (msg) => typeof msg.sender === 'object' ? msg.sender?.role || '' : '';
  const isOwnMessage = (msg) => {
    const senderId = typeof msg.sender === 'object' ? msg.sender?._id : null;
    return senderId === user?._id || getSenderName(msg) === user?.name;
  };

  const getRoomIcon = (name) => {
    if (name?.startsWith('project:')) return FolderKanban;
    return channelIcons[name] || Hash;
  };

  const staticRooms = rooms.filter(r => !r.name?.startsWith('project:') && r.type !== 'project' && r.type !== 'dm');
  const projectRooms = rooms.filter(r => r.name?.startsWith('project:') || r.type === 'project');
  const dmRooms = rooms.filter(r => r.type === 'dm');
  const activeLabel = rooms.find(r => r.name === activeRoom)?.label || activeRoom;
  const activeDmUser = rooms.find(r => r.name === activeRoom)?.otherUser;

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-border rounded-xl overflow-hidden bg-background-surface shadow-card animate-fadeIn">
      {/* Sidebar */}
      <div className={`${mobileSidebar ? 'fixed inset-0 z-50 bg-background-base' : 'w-56 bg-background-base flex-col md:flex hidden'} border-r border-border`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-text-primary text-sm">Channels</h2>
          {mobileSidebar && (
            <button onClick={() => setMobileSidebar(false)} className="p-1 text-text-muted hover:text-text-primary rounded-lg"><X className="w-4 h-4" /></button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 pt-2 pb-1">Channels</p>
          {staticRooms.map(room => {
            const name = room.name || room;
            const label = room.label || room;
            const Icon = getRoomIcon(name);
            return (
              <button key={name} onClick={() => switchRoom(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${activeRoom === name ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{label}</span>
              </button>
            );
          })}
          {projectRooms.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 pt-4 pb-1">Projects</p>
              {projectRooms.map(room => {
                const name = room.name || room;
                const label = room.label || room;
                return (
                  <button key={name} onClick={() => switchRoom(name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${activeRoom === name ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'}`}
                    title={room.members?.map(m => m.name).join(', ')}>
                    <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1 text-left">{label}</span>
                    {room.memberCount && <span className="text-[10px] bg-background-hover px-1.5 py-0.5 rounded-full">{room.memberCount}</span>}
                  </button>
                );
              })}
            </>
          )}

          {/* Direct Messages */}
          <div className="flex items-center justify-between px-3 pt-4 pb-1">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Direct Messages</p>
            <button onClick={() => setShowNewDm(!showNewDm)} className="p-0.5 text-text-muted hover:text-accent rounded transition-colors" title="New message">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New DM user picker */}
          {showNewDm && (
            <div className="mx-2 mb-1 bg-background-surface border border-border rounded-lg max-h-40 overflow-y-auto">
              {chatUsers.map(u => (
                <button key={u._id} onClick={() => startDm(u)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-background-hover transition-colors">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                      {u.avatar ? <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background-surface ${isUserOnline(u._id) ? 'bg-success' : 'bg-text-muted'}`} />
                  </div>
                  <span className="flex-1 text-left truncate text-text-primary font-medium">{u.name}</span>
                  <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${u.role === 'admin' ? 'bg-danger/10 text-danger' : u.role === 'manager' ? 'bg-accent/10 text-accent' : 'bg-background-hover text-text-muted'}`}>{u.role}</span>
                </button>
              ))}
            </div>
          )}

          {dmRooms.map(room => {
            const name = room.name;
            const other = room.otherUser;
            const online = other ? isUserOnline(other._id) : false;
            return (
              <button key={name} onClick={() => switchRoom(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${activeRoom === name ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'}`}>
                <div className="relative shrink-0">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                    {other?.avatar ? <img src={other.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : (other?.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background-base ${online ? 'bg-success' : 'bg-text-muted'}`} />
                </div>
                <span className="truncate flex-1 text-left">{room.label}</span>
                {!online && other?.lastSeen && (
                  <span className="text-[9px] text-text-muted">{formatLastSeen(other.lastSeen)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-4 shrink-0 bg-background-surface gap-3">
          <button onClick={() => setMobileSidebar(true)} className="md:hidden p-1 text-text-muted hover:text-text-primary"><Hash className="w-5 h-5" /></button>
          {activeRoom.startsWith('dm:') ? (
            <>
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                  {activeDmUser?.avatar ? <img src={activeDmUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : (activeDmUser?.name?.charAt(0) || '?').toUpperCase()}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background-surface ${activeDmUser && isUserOnline(activeDmUser._id) ? 'bg-success' : 'bg-text-muted'}`} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-text-primary text-sm truncate">{activeLabel}</h2>
                <p className="text-[10px] text-text-muted leading-tight">
                  {activeDmUser && isUserOnline(activeDmUser._id)
                    ? <span className="text-success font-medium">Active now</span>
                    : activeDmUser?.lastSeen
                      ? <span>Last seen {formatLastSeen(activeDmUser.lastSeen)}</span>
                      : 'Offline'}
                </p>
              </div>
              {activeDmUser?.role && (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ml-auto ${activeDmUser.role === 'admin' ? 'bg-danger/10 text-danger' : activeDmUser.role === 'manager' ? 'bg-accent/10 text-accent' : 'bg-background-hover text-text-muted'}`}>{activeDmUser.role}</span>
              )}
            </>
          ) : (
            <>
              {(() => { const Icon = getRoomIcon(activeRoom); return <Icon className="w-4 h-4 text-text-muted" />; })()}
              <h2 className="font-display font-semibold text-text-primary text-sm truncate">{activeLabel}</h2>
              <span className="text-[10px] text-text-muted font-medium bg-background-hover px-2 py-0.5 rounded-full">{messages.length}</span>
              {activeRoom.startsWith('project:') && (() => {
                const room = rooms.find(r => r.name === activeRoom);
                return room?.members ? (
                  <span className="text-[10px] text-text-muted ml-auto hidden sm:block">{room.members.map(m => m.name).join(', ')}</span>
                ) : null;
              })()}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loadingMsgs ? (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              {activeRoom.startsWith('dm:') ? (
                <>
                  <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Start a conversation with {activeLabel}</p>
                </>
              ) : (
                <>
                  <Hash className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Welcome to #{activeLabel}. Start the conversation!</p>
                </>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const own = isOwnMessage(msg);
              const senderName = getSenderName(msg);
              const senderRole = getSenderRole(msg);
              const isAdmin = user?.role === 'admin';
              const roleBadge = senderRole === 'admin' ? 'bg-danger/10 text-danger' : senderRole === 'manager' ? 'bg-accent/10 text-accent' : '';
              return (
                <div key={msg._id || idx} className={`group flex gap-3 ${own ? 'flex-row-reverse' : ''}`}>
                  <div
                    onClick={() => {
                      if (!own && typeof msg.sender === 'object' && msg.sender?._id) {
                        startDm({ _id: msg.sender._id, name: msg.sender.name, email: msg.sender.email, role: msg.sender.role, avatar: msg.sender.avatar });
                      }
                    }}
                    title={!own ? `Message ${senderName}` : ''}
                    className={`relative shrink-0 ${!own ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent ${!own ? 'hover:ring-2 hover:ring-accent/30 transition-all' : ''}`}>
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    {(() => {
                      const senderId = typeof msg.sender === 'object' ? msg.sender?._id : null;
                      if (!senderId) return null;
                      return <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background-surface ${isUserOnline(senderId) ? 'bg-success' : 'bg-text-muted'}`} />;
                    })()}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${own ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold text-text-primary ${!own ? 'hover:text-accent cursor-pointer transition-colors' : ''}`}
                        onClick={() => {
                          if (!own && typeof msg.sender === 'object' && msg.sender?._id) {
                            startDm({ _id: msg.sender._id, name: msg.sender.name, email: msg.sender.email, role: msg.sender.role, avatar: msg.sender.avatar });
                          }
                        }}
                      >{senderName}</span>
                      {roleBadge && <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${roleBadge}`}>{senderRole}</span>}
                      <span className="text-[10px] text-text-muted">{formatTime(msg.createdAt)}</span>
                      {msg.edited && <span className="text-[9px] text-text-muted italic">(edited)</span>}
                    </div>

                    {editingId === msg._id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input value={editContent} onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitEdit()}
                          className="flex-1 px-3 py-1.5 bg-background-base border border-accent rounded-lg text-sm text-text-primary focus:outline-none" autoFocus />
                        <button onClick={submitEdit} className="p-1.5 text-success hover:bg-success/10 rounded-lg"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${own ? 'bg-accent text-white rounded-br-sm' : 'bg-background-hover text-text-primary rounded-bl-sm'}`}>
                          {msg.content}
                        </div>
                        {/* Hover actions */}
                        <div className={`absolute -top-3 ${own ? 'left-0' : 'right-0'} hidden group-hover:flex items-center gap-0.5 bg-background-surface border border-border rounded-lg shadow-card px-1 py-0.5`}
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEmojiPickerId(emojiPickerId === msg._id ? null : msg._id)}
                            className="p-1 text-text-muted hover:text-accent hover:bg-background-hover rounded transition-colors" title="React">
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          {canEdit(msg) && (
                            <button onClick={() => handleEdit(msg)}
                              className="p-1 text-text-muted hover:text-accent hover:bg-background-hover rounded transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setMenuOpenId(menuOpenId === msg._id ? null : msg._id)}
                            className="p-1 text-text-muted hover:text-danger hover:bg-background-hover rounded transition-colors" title="Delete">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Delete menu */}
                        {menuOpenId === msg._id && (
                          <div className={`absolute top-full mt-1 ${own ? 'right-0' : 'left-0'} bg-background-surface border border-border rounded-xl shadow-modal z-30 py-1 min-w-[180px]`}
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleDeleteForMe(msg._id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Delete for me
                            </button>
                            {(isAdmin || own) && (
                              <button onClick={() => handleDeleteForEveryone(msg._id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                              </button>
                            )}
                          </div>
                        )}
                        {/* Emoji picker */}
                        {emojiPickerId === msg._id && (
                          <div className={`absolute top-full mt-1 ${own ? 'right-0' : 'left-0'} bg-background-surface border border-border rounded-xl shadow-modal z-30 p-2 flex gap-1 flex-wrap max-w-[200px]`}
                            onClick={e => e.stopPropagation()}>
                            {QUICK_EMOJIS.map(emoji => (
                              <button key={emoji} onClick={() => handleReaction(msg._id, emoji)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-hover text-base transition-colors">{emoji}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => {
                            const e = r.emoji;
                            if (!acc[e]) acc[e] = { count: 0, users: [], hasOwn: false };
                            acc[e].count++;
                            acc[e].users.push(r.user?.name || '');
                            if (r.user?._id === user?._id || r.user === user?._id) acc[e].hasOwn = true;
                            return acc;
                          }, {})
                        ).map(([emoji, data]) => (
                          <button key={emoji} onClick={() => handleReaction(msg._id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${data.hasOwn ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-background-hover border-border text-text-secondary hover:border-accent/30'}`}
                            title={data.users.join(', ')}>
                            <span>{emoji}</span><span className="font-medium">{data.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{typingUsers.join(', ')} typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 bg-background-base border-t border-border">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input type="text" value={inputValue} onChange={handleInputChange}
              placeholder={activeRoom.startsWith('dm:') ? `Message ${activeLabel}...` : `Message #${activeLabel}...`}
              className="w-full bg-background-surface border border-border rounded-xl pl-4 pr-12 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm" />
            <button type="submit" disabled={!inputValue.trim()}
              className="absolute right-2 p-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
