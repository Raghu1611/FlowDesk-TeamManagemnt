import { useState, useEffect, useRef, useContext } from 'react';
import { Send, Hash, Lock, Megaphone } from 'lucide-react';
import { useSelector } from 'react-redux';
import { SocketContext } from '../../App';
import { getMessagesAPI, getRoomsAPI } from '../../api/message.api';

const channelIcons = {
  announcements: Megaphone,
  management: Lock,
  leadership: Lock,
};

const ChatPage = () => {
  const { user } = useSelector(state => state.auth);
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('general');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load rooms
  useEffect(() => {
    getRoomsAPI().then(res => {
      setRooms(res.data);
      if (res.data.length > 0 && !res.data.find(r => r.name === activeRoom)) {
        setActiveRoom(res.data[0].name);
      }
    }).catch(() => {});
  }, []);

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
      if (data.room === activeRoom) {
        setMessages(prev => [...prev, data]);
      }
    };

    const handleTypingStart = (data) => {
      if (data.room === activeRoom && data.user !== user?.name) {
        setTypingUsers(prev => prev.includes(data.user) ? prev : [...prev, data.user]);
      }
    };

    const handleTypingStop = (data) => {
      if (data.room === activeRoom) {
        setTypingUsers(prev => prev.filter(u => u !== data.user));
      }
    };

    socket.on('receive_message', handleMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleMessage);
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

    socket.emit('send_message', {
      room: activeRoom,
      content: inputValue,
      sender: user?.name || 'Anonymous',
    });

    socket.emit('typing_stop', { room: activeRoom });
    setInputValue('');
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (socket) {
      socket.emit('typing_start', { room: activeRoom });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing_stop', { room: activeRoom });
      }, 2000);
    }
  };

  const switchRoom = (room) => {
    if (room === activeRoom) return;
    if (socket) socket.emit('leave_room', activeRoom);
    setActiveRoom(room);
    setMessages([]);
    setTypingUsers([]);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (msg) => {
    if (typeof msg.sender === 'object') return msg.sender?.name || 'Unknown';
    return msg.sender || 'Unknown';
  };

  const getSenderRole = (msg) => {
    if (typeof msg.sender === 'object') return msg.sender?.role || '';
    return '';
  };

  const isOwnMessage = (msg) => {
    const senderName = getSenderName(msg);
    const senderId = typeof msg.sender === 'object' ? msg.sender?._id : null;
    return senderId === user?._id || senderName === user?.name;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-border rounded-xl overflow-hidden bg-background-surface shadow-card animate-fadeIn">
      {/* Sidebar Channels */}
      <div className="w-52 border-r border-border bg-background-base flex-col md:flex hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-text-primary text-sm">Channels</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {rooms.map(room => {
            const name = typeof room === 'object' ? room.name : room;
            const label = typeof room === 'object' ? room.label : room;
            const Icon = channelIcons[name] || Hash;
            return (
              <button
                key={name}
                onClick={() => switchRoom(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  activeRoom === name
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room selector for mobile */}
        <div className="md:hidden p-2 border-b border-border bg-background-base">
          <select value={activeRoom} onChange={e => switchRoom(e.target.value)} className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-sm">
            {rooms.map(r => {
              const name = typeof r === 'object' ? r.name : r;
              const label = typeof r === 'object' ? r.label : r;
              return <option key={name} value={name}># {label}</option>;
            })}
          </select>
        </div>

        <div className="h-12 border-b border-border flex items-center px-5 shrink-0 bg-background-surface">
          <Hash className="w-4 h-4 text-text-muted mr-2" />
          <h2 className="font-display font-semibold text-text-primary text-sm">{activeRoom}</h2>
          <span className="ml-2 text-[10px] text-text-muted font-medium bg-background-hover px-2 py-0.5 rounded-full">{messages.length} messages</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadingMsgs ? (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <Hash className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Welcome to #{activeRoom}. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const own = isOwnMessage(msg);
              const senderName = getSenderName(msg);
              const senderRole = getSenderRole(msg);
              const roleBadge = senderRole === 'admin' ? 'bg-danger/10 text-danger' : senderRole === 'manager' ? 'bg-accent/10 text-accent' : '';
              return (
                <div key={msg._id || idx} className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${own ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-text-primary">{senderName}</span>
                      {roleBadge && <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${roleBadge}`}>{senderRole}</span>}
                      <span className="text-[10px] text-text-muted">{formatTime(msg.createdAt || msg.time)}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      own
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-background-hover text-text-primary rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
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
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Message #${activeRoom}...`}
              className="w-full bg-background-surface border border-border rounded-xl pl-4 pr-12 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 p-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
