import { useState, useEffect } from 'react';
import api from '../api';

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [sites, setSites] = useState([]);
  const [siteFilter, setSiteFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/programs').then(r => r.json()),
      api('/api/sites').then(r => r.json()),
    ])
      .then(([progs, sites]) => {
        setPrograms(progs);
        setSites(sites);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = programs.filter(p => {
    if (siteFilter && String(p.site_id) !== siteFilter) return false;
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.age_group?.toLowerCase().includes(q)
    );
  });

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

  return (
    <div>
      <h1>Programs</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Browse discovered programs
      </p>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search programs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        {sites.length > 1 && (
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            style={{ flex: '0 0 auto' }}
          >
            <option value="">All sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>
            {programs.length === 0
              ? 'No programs discovered yet. Go to Sites and click Discover.'
              : 'No programs match your search.'}
          </p>
        )}

        {filtered.map(prog => (
          <div key={prog.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong>{prog.name}</strong>
              {prog.type && <span className="badge">{prog.type}</span>}
              {prog.registration_status && (
                <span className="badge" style={
                  prog.registration_status.toLowerCase() === 'open'
                    ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
                    : {}
                }>
                  {prog.registration_status}
                </span>
              )}
            </div>

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {prog.age_group && <span>Ages: {prog.age_group}</span>}
              {(prog.start_date || prog.end_date) && (
                <span>{[prog.start_date, prog.end_date].filter(Boolean).join(' – ')}</span>
              )}
              {(prog.day_of_week || prog.start_time) && (
                <span>{[prog.day_of_week, prog.start_time && prog.end_time ? `${prog.start_time}–${prog.end_time}` : prog.start_time].filter(Boolean).join(', ')}</span>
              )}
              {prog.location && <span>{prog.location}</span>}
              {prog.cost && <span>{prog.cost}</span>}
              {sites.length > 1 && siteMap[prog.site_id] && (
                <span style={{ fontSize: 12 }}>Source: {siteMap[prog.site_id]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
