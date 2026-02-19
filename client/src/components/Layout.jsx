import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/sites', label: 'Sites', icon: '◎' },
  { to: '/programs', label: 'Programs', icon: '▤' },
  { to: '/watch-rules', label: 'Watches', icon: '⚡' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
];

export default function Layout() {
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
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
