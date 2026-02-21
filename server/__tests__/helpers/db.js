const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(':memory:');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
