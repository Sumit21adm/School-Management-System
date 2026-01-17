const fs = require('fs');
const path = require('path');

const schemaPath = process.argv[2];
const outputPath = process.argv[3];

if (!schemaPath || !outputPath) {
    console.error('Usage: node convert-schema-sqlite.js <input-schema> <output-schema>');
    process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Converting schema to SQLite...');

// 1. Change provider to sqlite
schema = schema.replace(/provider\s*=\s*"mysql"/, 'provider = "sqlite"');

// 2. Remove @db.* attributes (not supported in SQLite)
schema = schema.replace(/@db\.VarChar\(\d+\)/g, '');
schema = schema.replace(/@db\.VarChar/g, '');
schema = schema.replace(/@db\.Text/g, '');
schema = schema.replace(/@db\.Date/g, '');
schema = schema.replace(/@db\.Time/g, '');
schema = schema.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');
// Handle cases where Decimal doesn't have args if any, though usually does.

// 3. Fix Enums (SQLite doesn't support native enums, Prisma simulates them but we need to be careful)
// Actually Prisma handles Enums in SQLite nicely by just enforcing them in the client.
// No specific change needed for Enums usually, unless @map is used strangely.

// 4. Fix specific MySQL-only types if any
// TinyInt to Boolean is usually automatic, but if mapped explicitely:
// model has @db.TinyInt -> remove

// 5. Ensure ID AUTO_INCREMENT is compatible.
// MySQL: @id @default(autoincrement())
// SQLite: @id @default(autoincrement()) works fine (maps to INTEGER PRIMARY KEY AUTOINCREMENT)

console.log('Writing SQLite schema...');
fs.writeFileSync(outputPath, schema);
console.log('Conversion complete.');
