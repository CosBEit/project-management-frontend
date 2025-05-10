import 'regenerator-runtime/runtime';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import decodeCookie from './utils/decodeCookie';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './styles/global.css';
import apiCall from './utils/axiosInstance';
import ProtectedRoute from './utils/ProtectedRoute';
import { LOGOUT_URL } from './config';
import AdminDashboard from './pages/admin/Dashboard';
import ProjectDetails from './pages/admin/ProjectDetails';

import UsersList from './pages/admin/UsersList';
import CreateAccount from './pages/CreateAccount';
import TaskDetails from './pages/TaskDetails';
function App() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(!!decodeCookie());
  const userRole = useSelector(state => state.UserRoleReduxState);

  useEffect(() => {
    const decodedToken = decodeCookie();
    if (decodedToken) {
      setAuthenticated(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiCall.get(LOGOUT_URL, { withCredentials: true });
      setAuthenticated(false);
      navigate('/');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path="/" element={
          authenticated ? (
            userRole === 'admin' ? (
              <Navigate to="/dashboard/projects" />
            ) : (
              <Navigate to="/tasks" />
            )
          ) : (
            <Login setAuthenticated={setAuthenticated} />
          )
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/dashboard/projects" element={
          <ProtectedRoute>
            <AdminDashboard handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/users" element={
          <ProtectedRoute>
            <UsersList handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/project-details" element={
          <ProtectedRoute>
            <ProjectDetails handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/task-details" element={
          <ProtectedRoute>
            <TaskDetails handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
