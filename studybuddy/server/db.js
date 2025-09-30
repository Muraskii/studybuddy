import fs from 'fs';

const url = process.env.DATABASE_URL || './studybuddy.db';

let dbType = 'sqlite';
if (/^postgres(ql)?:\/\//i.test(url)) dbType = 'pg';

let api = { kind: 'sqlite' };

if (dbType === 'sqlite') {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(url);
  const schemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url)).toString();
  db.exec(schemaSql);
  api = {
    kind: 'sqlite',
    prepare: (sql) => db.prepare(sql),
    exec: (sql) => db.exec(sql)
  };
} else {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Ensure base tables exist (PG-compatible definitions)
  await client.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT DEFAULT 'Mura')");
  await client.query("CREATE TABLE IF NOT EXISTS notes (id SERIAL PRIMARY KEY, user_id INTEGER DEFAULT 1, title TEXT, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())");
  await client.query("CREATE TABLE IF NOT EXISTS weak_topics (id SERIAL PRIMARY KEY, user_id INTEGER DEFAULT 1, topic TEXT NOT NULL, reason TEXT, strength INTEGER DEFAULT 0, last_review TIMESTAMP)");
  await client.query("CREATE TABLE IF NOT EXISTS chats (id SERIAL PRIMARY KEY, user_id INTEGER DEFAULT 1, role TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())");
  await client.query("CREATE TABLE IF NOT EXISTS quizzes (id SERIAL PRIMARY KEY, user_id INTEGER DEFAULT 1, source_note_id INTEGER, payload TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())");
  await client.query("INSERT INTO users(id, name) VALUES (1, 'Mura') ON CONFLICT (id) DO NOTHING");

  api = {
    kind: 'pg',
    prepare(sql){
      return {
        run: async (...params) => { await client.query(sql, params); },
        get: async (...params) => (await client.query(sql, params)).rows[0],
        all: async (...params) => (await client.query(sql, params)).rows
      };
    }
  };
}

export default api;
