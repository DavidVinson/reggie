import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Programs from './pages/Programs';
import WatchRules from './pages/WatchRules';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Setup from './pages/Setup';
import { getToken } from './api';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

// On first load, check if setup is needed and redirect to /setup if so.
function SetupGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(data => {
        if (data.needsSetup) navigate('/setup', { replace: true });
      })
      .catch(() => {});
  }, []);

  return null;
}

export default function App() {
  return (
    <>
      <SetupGuard />
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/watch-rules" element={<WatchRules />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </>
  );
}
