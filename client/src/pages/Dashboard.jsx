import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [siteCount, setSiteCount] = useState(null);

  useEffect(() => {
    fetch('/api/sites')
      .then(res => res.json())
      .then(data => setSiteCount(data.length))
      .catch(() => setSiteCount(0));
  }, []);

  const siteLabel = siteCount === null
    ? 'Loading...'
    : siteCount === 0
      ? 'No sites configured yet'
      : `${siteCount} site${siteCount === 1 ? '' : 's'} configured`;

  return (
    <div>
      <h1>Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Your activity registration agent
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card">
          <h3>Sites</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{siteLabel}</p>
        </div>
        <div className="card">
          <h3>Watch Rules</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No active watches</p>
        </div>
        <div className="card">
          <h3>Notifications</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No notifications</p>
        </div>
      </div>
    </div>
  );
}
