import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Programs from './pages/Programs';
import WatchRules from './pages/WatchRules';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/watch-rules" element={<WatchRules />} />
      </Route>
    </Routes>
  );
}
