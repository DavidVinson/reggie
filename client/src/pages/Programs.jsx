import { useState, useEffect } from 'react';

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [sites, setSites] = useState([]);
  const [siteFilter, setSiteFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/programs').then(r => r.json()),
      fetch('/api/sites').then(r => r.json()),
    ])
      .then(([progs, sites]) => {
        setPrograms(progs);
        setSites(sites);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = siteFilter
    ? programs.filter(p => String(p.site_id) === siteFilter)
    : programs;

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

  return (
    <div>
      <h1>Programs</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
        Browse discovered programs
      </p>

      {sites.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            style={{ maxWidth: 240 }}
          >
            <option value="">All sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>
            No programs discovered yet. Ask Claude to discover a site.
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
