import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import db from './db.js';

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({ origin: process.env.ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '8mb' }));

const isPg = (db.kind === 'pg');

// Helpers to normalize sync/async DB calls
const wrap = async (fn, ...args) => {
  const out = fn(...args);
  return (isPg && out && typeof out.then === 'function') ? await out : out;
};

// Prepared statements
const insertChat = db.prepare('INSERT INTO chats(user_id, role, content) VALUES (1, $1, $2)');
const insertNote = db.prepare('INSERT INTO notes(user_id, title, content) VALUES (1, $1, $2)');
const listNotes = db.prepare('SELECT id, title, ' + (isPg ? "substring(content from 1 for 160)" : "substr(content,1,160)") + ' AS preview, created_at FROM notes ORDER BY created_at DESC LIMIT 100');
const getNote = db.prepare('SELECT * FROM notes WHERE id = $1');
const addWeak = db.prepare('INSERT INTO weak_topics(user_id, topic, reason, strength, last_review) VALUES (1, $1, $2, 0, NOW())');
const listWeak = db.prepare('SELECT * FROM weak_topics ORDER BY strength ASC NULLS FIRST, last_review NULLS FIRST');
const bumpWeak = db.prepare('UPDATE weak_topics SET strength = strength + 1, last_review = NOW() WHERE id = $1');
const insertQuiz = db.prepare('INSERT INTO quizzes(user_id, source_note_id, payload) VALUES (1, $1, $2)');
const listQuizzes = db.prepare('SELECT id, source_note_id, payload, created_at FROM quizzes ORDER BY created_at DESC LIMIT 50');

async function askTutor({ subject, style, prompt }) {
  const system = `You are StudyBuddy, a patient tutor for undergraduate ECE.
- Be concise but precise. Use equations when needed in LaTeX.
- Ask one probing question when user seems unsure.
- If the user misunderstands a concept, propose a mini-quiz (1 MCQ + 1 short).
- Keep answers ≤120 words unless user requests depth.`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: `Subject: ${subject || 'General'}\nStyle: ${style || 'Socratic, friendly'}\n\n${prompt}` }
  ];

  const recent = await wrap(() => db.prepare('SELECT role, content FROM chats ORDER BY id DESC LIMIT 6').all());
  (recent || []).reverse().forEach(m => messages.push({ role: m.role, content: m.content }));

  const resp = await openai.responses.create({ model: 'gpt-5', input: messages });
  return resp.output_text?.trim() || '';
}

async function summarizeNotes(text) {
  const resp = await openai.responses.create({
    model: 'gpt-5',
    input: [
      { role: 'system', content: 'You condense class notes into a crisp study sheet.' },
      { role: 'user', content: `Summarize the following into:
- 5 key bullets
- Definitions
- Important formulas (LaTeX)
- Pitfalls

Text:
${text}` }
    ]
  });
  return resp.output_text?.trim() || '';
}

async function generateQuiz(fromText) {
  const resp = await openai.responses.create({
    model: 'gpt-5',
    input: [
      { role: 'system', content: 'Create tight practice quizzes aligned to ECE undergrad level.' },
      { role: 'user', content: `From the material below, create a JSON quiz with fields:
{
  "topic": string,
  "mcq": [{"q": string, "choices":[string,string,string,string], "answer": number, "why": string}],
  "short": [{"q": string, "rubric": string}],
  "weak_topics": [string]
}

Material:
${fromText}` }
    ],
    response_format: { type: 'json_object' }
  });
  try {
    return JSON.parse(resp.output_text || '{}');
  } catch {
    return { topic: "Quiz", mcq: [], short: [], weak_topics: [] };
  }
}

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, subject, style } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    await wrap(insertChat.run.bind(insertChat), 'user', prompt);
    const answer = await askTutor({ subject, style, prompt });
    await wrap(insertChat.run.bind(insertChat), 'assistant', answer);
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/notes', async (req, res) => {
  const rows = await wrap(listNotes.all.bind(listNotes));
  res.json({ notes: rows });
});

app.get('/api/notes/:id', async (req, res) => {
  const note = await wrap(getNote.get.bind(getNote), req.params.id);
  if (!note) return res.status(404).json({ error: 'not found' });
  res.json({ note });
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    await wrap(insertNote.run.bind(insertNote), title || 'Untitled', content);
    const summary = await summarizeNotes(content);
    res.json({ summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Memory uploads (serverless-safe)
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    let text = '';
    if (ext === 'pdf') {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString('utf8');
    }
    await wrap(insertNote.run.bind(insertNote), req.file.originalname, text);
    const summary = await summarizeNotes(text);
    res.json({ summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/quiz/from-note', async (req, res) => {
  try {
    const { noteId } = req.body;
    const note = await wrap(getNote.get.bind(getNote), noteId);
    if (!note) return res.status(404).json({ error: 'note not found' });
    const quiz = await generateQuiz(note.content);
    await wrap(insertQuiz.run.bind(insertQuiz), noteId, JSON.stringify(quiz));
    for (const t of quiz.weak_topics || []) await wrap(addWeak.run.bind(addWeak), t, 'auto-detected from quiz');
    res.json({ quiz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/quizzes', async (req, res) => {
  const rows = await wrap(listQuizzes.all.bind(listQuizzes));
  res.json({ quizzes: rows.map(r => ({...r, payload: JSON.parse(r.payload)})) });
});

app.get('/api/weak', async (req, res) => {
  const rows = await wrap(listWeak.all.bind(listWeak));
  res.json({ topics: rows });
});

app.post('/api/weak', async (req, res) => {
  const { topic, reason } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });
  await wrap(addWeak.run.bind(addWeak), topic, reason || 'added by user');
  res.json({ ok: true });
});

app.post('/api/weak/:id/bump', async (req, res) => {
  await wrap(bumpWeak.run.bind(bumpWeak), req.params.id);
  res.json({ ok: true });
});

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`StudyBuddy API on http://localhost:${port}`));
}

export default app;
