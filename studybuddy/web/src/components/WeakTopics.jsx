import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '';

export default function WeakTopics(){
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');

  async function refresh(){
    const r = await fetch(`${API}/api/weak`);
    const j = await r.json();
    setTopics(j.topics||[]);
  }
  useEffect(()=>{ refresh() },[]);

  async function add(){
    if(!topic.trim()) return;
    await fetch(`${API}/api/weak`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ topic, reason:'added by user'})});
    setTopic(''); refresh();
  }

  async function bump(id){ await fetch(`${API}/api/weak/${id}/bump`, { method:'POST' }); refresh(); }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-medium mb-2">Track Weak Topics</h3>
        <div className="flex gap-2">
          <input className="border rounded p-2 flex-1" placeholder="e.g., Op-amp stability" value={topic} onChange={e=>setTopic(e.target.value)} />
          <button onClick={add} className="px-3 py-2 bg-emerald-600 text-white rounded">Add</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-medium mb-3">Your Weak Topics</h3>
        <ul className="space-y-2">
          {topics.map(t => (
            <li key={t.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{t.topic}</div>
                <div className="text-xs text-gray-600">Strength: {t.strength} · Last review: {t.last_review || '—'}</div>
              </div>
              <button onClick={()=>bump(t.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded">Review +1</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
