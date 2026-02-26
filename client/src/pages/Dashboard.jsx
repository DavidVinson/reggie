import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const iso = dateStr.includes('T') ? dateStr + 'Z' : dateStr.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  const d = Math.round(diff / 86400000);
  if (d < 0) return null;
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [rules, setRules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/sites').then(r => r.json()),
      api('/api/programs').then(r => r.json()),
      api('/api/watch-rules').then(r => r.json()),
      api('/api/notifications').then(r => r.json()),
    ])
      .then(([s, p, r, n]) => { setSites(s); setPrograms(p); setRules(r); setNotifications(n); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter(n => !n.read);
  const activeRules = rules.filter(r => r.active);

  // Programs with upcoming registration deadlines (next 14 days)
  const upcomingDeadlines = programs
    .filter(p => p.registration_deadline && daysUntil(p.registration_deadline) !== null)
    .sort((a, b) => new Date(a.registration_deadline) - new Date(b.registration_deadline))
    .slice(0, 3);

  // Open programs
  const openPrograms = programs.filter(p =>
    p.registration_status === 'open' || p.registration_status === 'waitlist'
  );

  // Most recently checked rule
  const lastChecked = rules
    .filter(r => r.last_checked_at)
    .sort((a, b) => new Date(b.last_checked_at) - new Date(a.last_checked_at))[0];

  if (loading) {
    return (
      <div>
        <h1>Reggie</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20 }}>
        Your activity registration agent
      </p>

      {/* Unread alerts — most prominent if any */}
      {unread.length > 0 && (
        <Link to="/notifications" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            marginBottom: 12,
            borderColor: '#bfdbfe',
            background: '#eff6ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <strong style={{ color: '#1e40af' }}>
                {unread.length} unread alert{unread.length > 1 ? 's' : ''}
              </strong>
              <p style={{ fontSize: 13, color: '#3b82f6', marginTop: 2 }}>
                {unread[0].title}
              </p>
            </div>
            <span style={{ color: '#3b82f6', fontSize: 20 }}>→</span>
          </div>
        </Link>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Open programs */}
        {openPrograms.length > 0 ? (
          <Link to="/programs" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
              <strong style={{ color: '#166534' }}>
                {openPrograms.length} program{openPrograms.length > 1 ? 's' : ''} open now
              </strong>
              <p style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>
                {openPrograms.slice(0, 2).map(p => p.name).join(', ')}
                {openPrograms.length > 2 ? ` +${openPrograms.length - 2} more` : ''}
              </p>
            </div>
          </Link>
        ) : (
          <div className="card">
            <strong>Programs</strong>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {programs.length > 0 ? `${programs.length} discovered — none open right now` : 'No programs discovered yet'}
            </p>
          </div>
        )}

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div className="card">
            <strong>Upcoming Deadlines</strong>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingDeadlines.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                    {p.name}
                  </span>
                  <span style={{ color: daysUntil(p.registration_deadline) === 'today' ? '#dc2626' : '#d97706', flexShrink: 0, fontWeight: 600, fontSize: 13 }}>
                    {daysUntil(p.registration_deadline)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch rules status */}
        <Link to="/watch-rules" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>
                  {activeRules.length} active watch{activeRules.length !== 1 ? 'es' : ''}
                </strong>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {lastChecked
                    ? `Last checked ${timeAgo(lastChecked.last_checked_at)}`
                    : activeRules.length > 0 ? 'Not checked yet' : 'No active watches'}
                </p>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>→</span>
            </div>
          </div>
        </Link>

        {/* Sites */}
        <Link to="/sites" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>
                  {sites.length} site{sites.length !== 1 ? 's' : ''}
                </strong>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {sites.length === 0 ? 'Add a site to get started' : sites.map(s => s.name).slice(0, 2).join(', ') + (sites.length > 2 ? ` +${sites.length - 2}` : '')}
                </p>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>→</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
