const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  let sql = 'SELECT * FROM programs WHERE 1=1';
  const params = [];

  if (req.query.site_id) {
    sql += ' AND site_id = ?';
    params.push(req.query.site_id);
  }
  if (req.query.type) {
    sql += ' AND type = ?';
    params.push(req.query.type);
  }
  if (req.query.age_group) {
    sql += ' AND age_group = ?';
    params.push(req.query.age_group);
  }
  if (req.query.status) {
    sql += ' AND registration_status = ?';
    params.push(req.query.status);
  }

  sql += ' ORDER BY created_at DESC';

  const programs = db.prepare(sql).all(...params);
  res.json(programs);
});

module.exports = router;
