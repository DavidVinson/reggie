import { useState, useEffect } from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const iso = dateStr.includes('T') ? dateStr + 'Z' : dateStr.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      setNotifications(await res.json());
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, []);

  async function markRead(id) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: 1 } : notif));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })));
    setNotifications(n => n.map(notif => ({ ...notif, read: 1 })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Notifications</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
            Program openings and alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" style={{ marginTop: 4, flexShrink: 0 }} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
        {!loading && notifications.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>No notifications yet.</p>
        )}

        {notifications.map(notif => (
          <div
            key={notif.id}
            className="card"
            style={{
              borderLeft: notif.read ? '1px solid var(--color-border)' : '3px solid var(--color-primary)',
              cursor: notif.read ? 'default' : 'pointer',
            }}
            onClick={() => !notif.read && markRead(notif.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontWeight: notif.read ? 500 : 700 }}>{notif.title}</strong>
                {notif.body && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{notif.body}</p>
                )}
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  {timeAgo(notif.created_at)}
                </p>
              </div>
              {!notif.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-primary)', flexShrink: 0, marginTop: 6,
                }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
