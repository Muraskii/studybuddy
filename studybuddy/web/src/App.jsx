import { useState } from 'react';
import Header from './components/Header';
import ChatPane from './components/ChatPane';
import NotesPane from './components/NotesPane';
import QuizPane from './components/QuizPane';
import WeakTopics from './components/WeakTopics';

const API = import.meta.env.VITE_API_BASE || '';

export default function App(){
  const [tab, setTab] = useState('chat');
  const [summary, setSummary] = useState('');

  return (
    <div className="min-h-screen flex flex-col">
      <Header/>
      <main className="max-w-6xl mx-auto w-full p-4 flex-1 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-2">
            {['chat','notes','quiz'].map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded border ${tab===t?'bg-blue-600 text-white':'bg-white'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          {tab==='chat' && <ChatPane/>}
          {tab==='notes' && <NotesPane onSummary={setSummary}/>} 
          {tab==='quiz' && <QuizPane/>}
        </div>

        <aside className="space-y-4">
          <div className="bg-white border rounded-xl shadow p-4">
            <h3 className="font-medium mb-2">Auto Summary</h3>
            <div className="text-sm whitespace-pre-wrap">{summary || 'Add or upload notes to see a summary here.'}</div>
          </div>
          <WeakTopics/>
        </aside>
      </main>
      <footer className="text-center text-xs text-gray-500 p-4">© {new Date().getFullYear()} StudyBuddy</footer>
    </div>
  );
}
