const cron = require('node-cron');
const db = require('./db');
const { checkAllRules } = require('./watcher');

async function scrapedueSites() {
  // Find direct sites whose scrape_interval (in minutes) has elapsed since last_scraped_at
  const sites = db.prepare(`
    SELECT * FROM sites
    WHERE type = 'direct'
      AND (
        last_scraped_at IS NULL
        OR (unixepoch('now') - unixepoch(last_scraped_at)) >= scrape_interval * 60
      )
  `).all();

  if (sites.length === 0) return;

  const { discoverSite } = require('./agents/discover');
  const insert = db.prepare(`
    INSERT INTO programs (site_id, name, type, age_group, start_date, end_date, day_of_week, start_time, end_time, location, cost, registration_status, registration_deadline, spots_available, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRaw = db.prepare('INSERT INTO raw_scrapes (site_id, url, content) VALUES (?, ?, ?)');
  const bulkInsert = db.transaction((siteId, progs) => {
    db.prepare('DELETE FROM programs WHERE site_id = ?').run(siteId);
    for (const p of progs) {
      insert.run(
        siteId, p.name, p.type || null, p.ageGroup || null,
        p.dates?.start || null, p.dates?.end || null,
        p.times?.day || null, p.times?.start || null, p.times?.end || null,
        p.location || null,
        p.cost != null ? String(p.cost) : null,
        p.registrationStatus || null,
        p.registrationDeadline || null,
        p.spotsAvailable ?? null,
        p.sourceUrl || null
      );
    }
  });

  for (const site of sites) {
    try {
      console.log(`Reggie: scraping ${site.name}...`);
      const { rawScrapes, programs } = await discoverSite(site);
      for (const s of rawScrapes) insertRaw.run(site.id, s.url, s.content || null);
      bulkInsert(site.id, programs);
      db.prepare("UPDATE sites SET last_scraped_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(site.id);
      console.log(`Reggie: ${site.name} — ${programs.length} programs`);
    } catch (err) {
      console.error(`Reggie: scrape failed for ${site.name}:`, err.message);
    }
  }
}

function startScheduler() {
  // Every minute: check watch rules
  cron.schedule('* * * * *', async () => {
    await checkAllRules();
  });

  // Every minute: scrape sites that are due based on their scrape_interval
  cron.schedule('* * * * *', async () => {
    await scrapedueSites();
  });

  console.log('Reggie: scheduler started (watch rules + per-site scraping)');
}

module.exports = { startScheduler };
