import { useState, useEffect } from 'react';

function label(count, singular, zero) {
  if (count === null) return 'Loading...';
  if (count === 0) return zero;
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export default function Dashboard() {
  const [siteCount, setSiteCount] = useState(null);
  const [programCount, setProgramCount] = useState(null);
  const [activeWatchCount, setActiveWatchCount] = useState(null);
  const [unreadCount, setUnreadCount] = useState(null);

  useEffect(() => {
    fetch('/api/sites')
      .then(res => res.json())
      .then(data => setSiteCount(data.length))
      .catch(() => setSiteCount(0));
    fetch('/api/programs')
      .then(res => res.json())
      .then(data => setProgramCount(data.length))
      .catch(() => setProgramCount(0));
    fetch('/api/watch-rules')
      .then(res => res.json())
      .then(data => setActiveWatchCount(data.filter(r => r.active).length))
      .catch(() => setActiveWatchCount(0));
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setUnreadCount(data.filter(n => !n.read).length))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <div>
      <h1>Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Your activity registration agent
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card">
          <h3>Sites</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {label(siteCount, 'site', 'No sites configured yet')}
          </p>
        </div>
        <div className="card">
          <h3>Programs</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {label(programCount, 'program', 'No programs discovered')}
          </p>
        </div>
        <div className="card">
          <h3>Watch Rules</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {label(activeWatchCount, 'active watch', 'No active watches')}
          </p>
        </div>
        <div className="card">
          <h3>Notifications</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {unreadCount === null ? 'Loading...' : unreadCount === 0 ? 'No unread notifications' : `${unreadCount} unread`}
          </p>
        </div>
      </div>
    </div>
  );
}
