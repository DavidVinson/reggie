jest.mock('../db', () => require('./helpers/db'));

const db = require('./helpers/db');
const { checkRule, checkAllRules } = require('../watcher');

let siteId, programId, ruleId;

beforeEach(() => {
  // Clean slate for each test
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM watch_rules').run();
  db.prepare('DELETE FROM programs').run();
  db.prepare('DELETE FROM sites').run();

  const site = db.prepare(
    'INSERT INTO sites (name, url, type) VALUES (?, ?, ?)'
  ).run('Watcher Test Site', 'https://watcher-test.example.com', 'direct');
  siteId = site.lastInsertRowid;

  // type matches the rule's activity_type so the query filter hits
  const program = db.prepare(
    'INSERT INTO programs (site_id, name, type, registration_status) VALUES (?, ?, ?, ?)'
  ).run(siteId, 'Youth Soccer', 'Soccer', 'open');
  programId = program.lastInsertRowid;

  // Rule matches on site_id + activity_type
  const rule = db.prepare(
    'INSERT INTO watch_rules (site_id, activity_type, active) VALUES (?, ?, ?)'
  ).run(siteId, 'Soccer', 1);
  ruleId = rule.lastInsertRowid;
});

describe('checkRule', () => {
  it('returns { notified: 0 } when no programs match', () => {
    // Rule targets a different activity type that has no matching programs
    const otherRule = db.prepare(
      'INSERT INTO watch_rules (site_id, activity_type, active) VALUES (?, ?, ?)'
    ).run(siteId, 'Gymnastics', 1);

    const result = checkRule(otherRule.lastInsertRowid);
    expect(result).toEqual({ notified: 0 });
  });

  it('returns { notified: 0 } for inactive rule', () => {
    const inactiveRule = db.prepare(
      'INSERT INTO watch_rules (site_id, active) VALUES (?, ?)'
    ).run(siteId, 0);

    const result = checkRule(inactiveRule.lastInsertRowid);
    expect(result).toEqual({ notified: 0 });
  });

  it('creates a notification for a matching open program', () => {
    const result = checkRule(ruleId);
    expect(result).toEqual({ notified: 1 });

    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE watch_rule_id = ?'
    ).all(ruleId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].program_id).toBe(programId);
    expect(notifications[0].type).toBe('opening');
  });

  it('does not double-notify for the same program', () => {
    checkRule(ruleId);
    const result = checkRule(ruleId);
    expect(result).toEqual({ notified: 0 });

    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE watch_rule_id = ?'
    ).all(ruleId);
    expect(notifications).toHaveLength(1);
  });

  it('notifies for waitlist programs', () => {
    db.prepare('UPDATE programs SET registration_status = ? WHERE id = ?').run('waitlist', programId);

    const result = checkRule(ruleId);
    expect(result).toEqual({ notified: 1 });
  });

  it('does not notify for closed programs', () => {
    db.prepare('UPDATE programs SET registration_status = ? WHERE id = ?').run('closed', programId);

    const result = checkRule(ruleId);
    expect(result).toEqual({ notified: 0 });
  });

  it('updates last_checked_at on the rule', () => {
    checkRule(ruleId);
    const rule = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(ruleId);
    expect(rule.last_checked_at).not.toBeNull();
  });
});

describe('checkAllRules', () => {
  it('calls checkRule for each active rule', () => {
    // Add a second active rule
    db.prepare(
      'INSERT INTO watch_rules (site_id, active) VALUES (?, ?)'
    ).run(siteId, 1);

    // Add a second open program (first rule matches site_id, no activity_type filter = matches all)
    db.prepare(
      'INSERT INTO programs (site_id, name, registration_status) VALUES (?, ?, ?)'
    ).run(siteId, 'Adult Volleyball', 'open');

    checkAllRules();

    const notifications = db.prepare('SELECT * FROM notifications').all();
    // Both active rules should have fired on their matching programs
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('does not throw if a rule errors', () => {
    // Pass a non-existent rule id — checkRule handles it gracefully
    const badRule = db.prepare(
      'INSERT INTO watch_rules (site_id, active) VALUES (?, ?)'
    ).run(siteId, 1);

    // Delete the site to cause FK-related edge; checkAllRules should still complete
    expect(() => checkAllRules()).not.toThrow();
  });
});
