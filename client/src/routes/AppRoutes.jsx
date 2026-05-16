import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import KanbanPage from '../pages/kanban/KanbanPage';
import ChatPage from '../pages/chat/ChatPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import TasksPage from '../pages/tasks/TasksPage';
import TeamPage from '../pages/team/TeamPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SettingsPage from '../pages/settings/SettingsPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
