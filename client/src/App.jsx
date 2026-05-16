import { Toaster } from 'react-hot-toast';
import { useEffect, useState, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { loadUser } from './features/auth/authSlice';
import { addTask, updateTask, removeTask } from './features/tasks/tasksSlice';
import { addProject, updateProject, removeProject } from './features/projects/projectsSlice';
import { addNotification, fetchNotifications } from './features/notifications/notificationsSlice';
import AppRoutes from './routes/AppRoutes';
import toast from 'react-hot-toast';

export const SocketContext = createContext(null);

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: { token }
      });
      setSocket(newSocket);

      newSocket.on('task:created', (task) => dispatch(addTask(task)));
      newSocket.on('task:updated', (task) => dispatch(updateTask(task)));
      newSocket.on('task:deleted', (taskId) => dispatch(removeTask(taskId)));
      newSocket.on('project:created', (project) => dispatch(addProject(project)));
      newSocket.on('project:updated', (project) => dispatch(updateProject(project)));
      newSocket.on('project:deleted', (projectId) => dispatch(removeProject(projectId)));
      
      newSocket.on('notification:new', (notification) => {
        dispatch(addNotification(notification));
        toast(notification.message || notification.title, {
          icon: '🔔',
          duration: 4000,
        });
      });

      // Fetch existing notifications
      dispatch(fetchNotifications());

      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, token, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px'
          }
        }}
      />
      <AppRoutes />
    </SocketContext.Provider>
  );
}

export default App;
