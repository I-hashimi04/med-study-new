const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/med-study.db');
const db = new sqlite3.Database(dbPath);

// Ensure schema is loaded
const schemaPath = path.resolve(__dirname, '../data/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error('Error loading schema:', err.message);
  } else {
    console.log('Database schema ensured.');
  }
});

module.exports = db;