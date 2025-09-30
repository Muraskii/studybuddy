-- Users (single-user demo). Extend with real auth later.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT DEFAULT 'Mura'
);
INSERT OR IGNORE INTO users(id, name) VALUES (1, 'Mura');

-- Notes uploaded or pasted
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weak topics tracked over time
CREATE TABLE IF NOT EXISTS weak_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  topic TEXT NOT NULL,
  reason TEXT,
  strength INTEGER DEFAULT 0, -- increases as user masters it
  last_review DATETIME
);

-- Chat transcripts (optional logging)
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  source_note_id INTEGER,
  payload TEXT NOT NULL, -- JSON quiz
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
