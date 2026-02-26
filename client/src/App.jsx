import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Programs from './pages/Programs';
import WatchRules from './pages/WatchRules';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { getToken } from './api';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
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
  );
}
