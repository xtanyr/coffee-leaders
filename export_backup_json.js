const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'dev_backup.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

const outputDir = path.join(__dirname, 'backup_json');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

for (const table of tables) {
  if (table.name === 'sqlite_sequence') continue;
  const rows = db.prepare(`SELECT * FROM "${table.name}"`).all();
  const filePath = path.join(outputDir, `${table.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Wrote ${rows.length} rows to ${filePath}`);
}

db.close();
