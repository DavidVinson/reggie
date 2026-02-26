import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../api';

export default function Setup() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed');
        return;
      }
      setToken(data.token);
      navigate('/');
    } catch {
      setError('Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: '60px auto' }}>
      <h1 style={{ fontSize: 28 }}>Welcome to Reggie</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 28, lineHeight: 1.5 }}>
        Set up your account to get started. You'll use this password to sign in.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Confirm password</label>
          <input
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Phone number <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional — for SMS alerts)</span></label>
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 14, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading || !password || !confirm} style={{ marginTop: 4 }}>
          {loading ? 'Setting up…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
