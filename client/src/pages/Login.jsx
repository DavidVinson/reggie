import { useState } from 'react';

export default function Login() {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call /api/auth/login, store JWT, redirect
  };

  return (
    <div style={{ padding: 16, maxWidth: 400, margin: '80px auto' }}>
      <h1>Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 24 }}>
        Sign in to continue
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
