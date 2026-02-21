import { useState, useEffect } from 'react';

const AGE_GROUPS = ['youth', 'adult', 'senior', 'all ages'];

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const iso = dateStr.includes('T') ? dateStr + 'Z' : dateStr.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function WatchRules() {
  const [rules, setRules] = useState([]);
  const [sites, setSites] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', program_id: '', activity_type: '', age_group: '' });
  const [checking, setChecking] = useState({});
  const [checkResults, setCheckResults] = useState({});

  async function fetchAll() {
    try {
      const [rulesRes, sitesRes, programsRes, typesRes] = await Promise.all([
        fetch('/api/watch-rules'),
        fetch('/api/sites'),
        fetch('/api/programs'),
        fetch('/api/programs/types'),
      ]);
      setRules(await rulesRes.json());
      setSites(await sitesRes.json());
      setPrograms(await programsRes.json());
      setTypes(await typesRes.json());
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const sitePrograms = programs.filter(p =>
    form.site_id ? p.site_id === Number(form.site_id) : false
  );

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch('/api/watch-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: form.site_id ? Number(form.site_id) : null,
        program_id: form.program_id ? Number(form.program_id) : null,
        activity_type: form.activity_type.trim() || null,
        age_group: form.age_group || null,
      }),
    });
    setForm({ site_id: '', program_id: '', activity_type: '', age_group: '' });
    setShowForm(false);
    fetchAll();
  }

  async function handleToggle(rule) {
    await fetch(`/api/watch-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !rule.active }),
    });
    fetchAll();
  }

  async function handleCheck(rule) {
    setChecking(c => ({ ...c, [rule.id]: true }));
    const res = await fetch(`/api/watch-rules/${rule.id}/check`, { method: 'POST' });
    const data = await res.json();
    setChecking(c => ({ ...c, [rule.id]: false }));
    setCheckResults(r => ({ ...r, [rule.id]: data }));
    setTimeout(() => setCheckResults(r => { const n = { ...r }; delete n[rule.id]; return n; }), 8000);
    fetchAll();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this watch rule?')) return;
    await fetch(`/api/watch-rules/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  return (
    <div>
      <h1>Watch Rules</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Get notified when programs open up
      </p>

      <button style={{ marginTop: 16 }} onClick={() => setShowForm(f => !f)}>
        {showForm ? 'Cancel' : 'Add Watch Rule'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label>Site (optional)</label>
            <select
              value={form.site_id}
              onChange={e => setForm({ ...form, site_id: e.target.value, program_id: '' })}
            >
              <option value="">Any site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {form.site_id && (
            <div className="form-group">
              <label>Program (optional)</label>
              <select
                value={form.program_id}
                onChange={e => setForm({ ...form, program_id: e.target.value })}
              >
                <option value="">Any program</option>
                {sitePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Activity Type (optional)</label>
            <select
              value={form.activity_type}
              onChange={e => setForm({ ...form, activity_type: e.target.value })}
            >
              <option value="">Any type</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Age Group (optional)</label>
            <select value={form.age_group} onChange={e => setForm({ ...form, age_group: e.target.value })}>
              <option value="">Any age group</option>
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Save Rule</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
        {!loading && rules.length === 0 && !showForm && (
          <p style={{ color: 'var(--color-text-muted)' }}>No watch rules yet. Add one to get notified when programs open up.</p>
        )}

        {rules.map(rule => (
          <div key={rule.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong>
                    {rule.program_name || rule.activity_type || 'Any program'}
                  </strong>
                  <span
                    className="badge"
                    style={rule.active ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' } : {}}
                  >
                    {rule.active ? 'active' : 'paused'}
                  </span>
                </div>

                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rule.site_name && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Site: {rule.site_name}
                    </p>
                  )}
                  {rule.age_group && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Age group: {rule.age_group}
                    </p>
                  )}
                  {rule.activity_type && !rule.program_name && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Type: {rule.activity_type}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Checked: {timeAgo(rule.last_checked_at)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  disabled={checking[rule.id]}
                  onClick={() => handleCheck(rule)}
                >
                  {checking[rule.id] ? 'Checking…' : 'Check now'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  onClick={() => handleToggle(rule)}
                >
                  {rule.active ? 'Pause' : 'Activate'}
                </button>
                <button
                  className="btn-danger"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  onClick={() => handleDelete(rule.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {checkResults[rule.id] && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                {checkResults[rule.id].notified === 0
                  ? <span style={{ color: 'var(--color-text-muted)' }}>No new matches</span>
                  : <span style={{ color: '#166534' }}>
                      {checkResults[rule.id].notified} new match{checkResults[rule.id].notified > 1 ? 'es' : ''} found —{' '}
                      <a href="/notifications">View alerts →</a>
                    </span>
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
