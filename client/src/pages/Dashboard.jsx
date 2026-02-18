export default function Dashboard() {
  return (
    <div>
      <h1>Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Your activity registration agent
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <h3>Sites</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No sites configured yet</p>
        </div>
        <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <h3>Watch Rules</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No active watches</p>
        </div>
        <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <h3>Notifications</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No notifications</p>
        </div>
      </div>
    </div>
  );
}
