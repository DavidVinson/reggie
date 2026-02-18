import { useState, useEffect } from 'react';

const API = '/api/sites';

const INTERVALS = [
  { value: 30, label: 'Every 30 min' },
  { value: 60, label: 'Every 1 hr' },
  { value: 360, label: 'Every 6 hr' },
  { value: 1440, label: 'Every 24 hr' },
];

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [programCounts, setProgramCounts] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', type: 'direct', scrape_interval: 60 });
  const [loading, setLoading] = useState(true);

  async function fetchSites() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setSites(data);
      // Fetch program counts
      const progRes = await fetch('/api/programs');
      const programs = await progRes.json();
      const counts = {};
      for (const p of programs) {
        counts[p.site_id] = (counts[p.site_id] || 0) + 1;
      }
      setProgramCounts(counts);
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSites(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', url: '', type: 'direct', scrape_interval: 60 });
    setShowForm(false);
    fetchSites();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this site?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchSites();
  }

  return (
    <div>
      <h1>Sites</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Manage activity program websites
      </p>

      <button style={{ marginTop: 16 }} onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Site'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label>Name</label>
            <input
              required
              placeholder="e.g. Fargo Parks"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input
              required
              placeholder="e.g. fargoparks.com"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="direct">Direct</option>
              <option value="portal">Portal</option>
            </select>
          </div>
          {form.type === 'portal' && (
            <p style={{ color: '#d97706', fontSize: 14, padding: '8px 12px', background: '#fef3c7', borderRadius: 8 }}>
              Portal sites are not supported yet. You can save it, but scraping won't work until portal support is added.
            </p>
          )}
          <div className="form-group">
            <label>Scrape Interval</label>
            <select
              value={form.scrape_interval}
              onChange={e => setForm({ ...form, scrape_interval: Number(e.target.value) })}
            >
              {INTERVALS.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Save Site</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
        {!loading && sites.length === 0 && !showForm && (
          <p style={{ color: 'var(--color-text-muted)' }}>No sites configured yet. Add one to get started.</p>
        )}
        {sites.map(site => (
          <div key={site.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>{site.name}</strong>
                <span className="badge">{site.type}</span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>{site.url}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 2 }}>
                {INTERVALS.find(i => i.value === site.scrape_interval)?.label || `Every ${site.scrape_interval} min`}
              </p>
              <p style={{ fontSize: 13, marginTop: 4, color: programCounts[site.id] ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {programCounts[site.id] ? `${programCounts[site.id]} program${programCounts[site.id] === 1 ? '' : 's'}` : 'No programs discovered'}
              </p>
            </div>
            <button className="btn-danger" style={{ padding: '8px 12px', fontSize: 14 }} onClick={() => handleDelete(site.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
