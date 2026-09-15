const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev_backup.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

for (const table of tables) {
  const count = db.prepare(`SELECT COUNT(*) as cnt FROM "${table.name}"`).get().cnt;
  console.log(`\n${table.name}: ${count} rows`);
  const rows = db.prepare(`SELECT * FROM "${table.name}" LIMIT 5`).all();
  console.log(JSON.stringify(rows, null, 2));
}

db.close();
