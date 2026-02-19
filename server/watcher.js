const db = require('./db');

// Find programs matching a watch rule that are open/waitlist and not yet notified,
// create notifications for each, and update last_checked_at.
function checkRule(ruleId) {
  const rule = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(ruleId);
  if (!rule || !rule.active) return { notified: 0 };

  const matches = db.prepare(`
    SELECT p.* FROM programs p
    LEFT JOIN notifications n ON n.program_id = p.id AND n.watch_rule_id = ?
    WHERE p.registration_status IN ('open', 'waitlist')
      AND n.id IS NULL
      AND (? IS NULL OR p.site_id = ?)
      AND (? IS NULL OR p.id = ?)
      AND (? IS NULL OR p.type = ?)
      AND (? IS NULL OR p.age_group = ?)
  `).all(
    ruleId,
    rule.site_id, rule.site_id,
    rule.program_id, rule.program_id,
    rule.activity_type, rule.activity_type,
    rule.age_group, rule.age_group
  );

  const insertNotification = db.prepare(`
    INSERT INTO notifications (type, title, body, program_id, watch_rule_id)
    VALUES ('opening', ?, ?, ?, ?)
  `);

  for (const program of matches) {
    const statusLabel = program.registration_status === 'waitlist' ? 'waitlist open' : 'open for registration';
    const bodyParts = [
      program.location ? `at ${program.location}` : null,
      program.start_date ? `starting ${program.start_date}` : null,
      program.spots_available != null ? `${program.spots_available} spot${program.spots_available === 1 ? '' : 's'} available` : null,
    ].filter(Boolean);

    insertNotification.run(
      `${program.name} is ${statusLabel}`,
      bodyParts.length ? bodyParts.join(' · ') : null,
      program.id,
      ruleId
    );
  }

  db.prepare(`
    UPDATE watch_rules SET last_checked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(ruleId);

  return { notified: matches.length };
}

function checkAllRules() {
  const rules = db.prepare('SELECT id FROM watch_rules WHERE active = 1').all();
  for (const rule of rules) {
    try {
      checkRule(rule.id);
    } catch (err) {
      console.error(`Reggie: watch rule ${rule.id} check failed:`, err.message);
    }
  }
}

module.exports = { checkRule, checkAllRules };
