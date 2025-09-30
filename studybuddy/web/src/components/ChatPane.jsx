import { useState } from 'react';
import LoadingDots from './LoadingDots';

const API = import.meta.env.VITE_API_BASE || '';

export default function ChatPane(){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Electronics');
  const [style, setStyle] = useState('Socratic, friendly');
  const [busy, setBusy] = useState(false);

  async function send(){
    if(!input.trim()) return;
    const mine = { role:'user', content: input };
    setMessages(m => [...m, mine]);
    setInput(''); setBusy(true);
    const r = await fetch(`${API}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: mine.content, subject, style }) });
    const j = await r.json();
    setBusy(false);
    setMessages(m => [...m, { role:'assistant', content: j.answer }]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <input className="border rounded p-2" value={subject} onChange={e=>setSubject(e.target.value)} />
        <input className="border rounded p-2 flex-1" value={style} onChange={e=>setStyle(e.target.value)} />
      </div>

      <div className="flex-1 overflow-auto bg-white border rounded-xl p-4 space-y-3 shadow">
        {messages.map((m,i)=> (
          <div key={i} className={m.role==='user'?'text-right':''}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.role==='user'?'bg-blue-600 text-white':'bg-gray-100'}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="text-gray-600"><LoadingDots/></div>}
      </div>

      <div className="mt-3 flex gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Ask a question…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} />
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}
