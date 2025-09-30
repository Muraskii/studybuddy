import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_BASE || '';

export default function NotesPane({ onSummary }){
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  async function refresh(){
    const r = await fetch(`${API}/api/notes`);
    const j = await r.json();
    setNotes(j.notes || []);
  }
  useEffect(() => { refresh() }, []);

  async function addNote(){
    if(!content.trim()) return;
    const r = await fetch(`${API}/api/notes`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title, content})});
    const j = await r.json();
    setTitle(''); setContent('');
    refresh();
    onSummary?.(j.summary);
  }

  async function uploadFile(e){
    const f = e.target.files[0]; if(!f) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch(`${API}/api/upload`, { method:'POST', body: fd });
    const j = await r.json();
    setUploading(false);
    refresh();
    onSummary?.(j.summary);
  }

  async function makeQuiz(id){
    const r = await fetch(`${API}/api/quiz/from-note`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ noteId:id })});
    await r.json();
    alert('Quiz created. Check Quiz tab!');
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-medium mb-2">Add Notes</h3>
        <input className="border rounded p-2 w-full mb-2" placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="border rounded p-2 w-full h-32 mb-2" placeholder="Paste notes here..." value={content} onChange={e=>setContent(e.target.value)} />
        <div className="flex items-center gap-2">
          <button onClick={addNote} className="px-3 py-2 bg-blue-600 text-white rounded">Save & Summarize</button>
          <label className="px-3 py-2 bg-gray-100 border rounded cursor-pointer">
            Upload .txt/.md/.pdf
            <input type="file" className="hidden" onChange={uploadFile} accept=".txt,.md,.pdf" />
          </label>
          {uploading && <span>Uploading…</span>}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-medium mb-3">Your Notes</h3>
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{n.title || 'Untitled'}</div>
                <div className="text-sm text-gray-600 line-clamp-1">{n.preview}</div>
              </div>
              <button onClick={()=>makeQuiz(n.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded">Make Quiz</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
