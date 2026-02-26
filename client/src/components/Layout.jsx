import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import api, { logout } from '../api';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/sites', label: 'Sites', icon: '◎' },
  { to: '/programs', label: 'Programs', icon: '▤' },
  { to: '/watch-rules', label: 'Watches', icon: '⚡' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
  { to: '/chat', label: 'Ask', icon: '?' },
];

export default function Layout() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api('/api/notifications');
        const data = await res.json();
        setUnread(data.filter(n => !n.read).length);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <nav className="layout-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <span className="nav-icon" style={{ position: 'relative', display: 'inline-block' }}>
              {item.icon}
              {item.to === '/notifications' && unread > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444',
                }} />
              )}
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="nav-item"
          style={{ background: 'none', border: 'none', minHeight: 'unset', minWidth: 'unset', padding: 0 }}
        >
          <span className="nav-icon">⎋</span>
          <span className="nav-label">Sign out</span>
        </button>
      </nav>
    </div>
  );
}
