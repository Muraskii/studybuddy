import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_BASE || '';

export default function QuizPane(){
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});

  async function refresh(){
    const r = await fetch(`${API}/api/quizzes`);
    const j = await r.json();
    setQuizzes(j.quizzes || []);
  }
  useEffect(()=>{ refresh() },[]);

  function setAns(key, val){ setAnswers(a => ({...a, [key]: val})); }

  function scoreQuiz(q){
    let score = 0, total = 0; const report = [];
    q.mcq?.forEach((item, idx)=>{ total++; if(Number(answers[`mcq-${q.id}-${idx}`])===item.answer) score++; else report.push(`MCQ ${idx+1}: ${item.why}`)});
    return { score, total, report };
  }

  return (
    <div className="space-y-4">
      {quizzes.map(qz => {
        const q = { id:qz.id, ...qz.payload };
        const res = scoreQuiz(q);
        return (
          <div key={qz.id} className="bg-white border rounded-xl shadow p-4">
            <div className="font-semibold mb-1">{q.topic}</div>
            <div className="text-sm text-gray-600 mb-3">Quiz #{qz.id} · From Note {qz.source_note_id ?? '—'}</div>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">Multiple Choice</div>
                {q.mcq?.map((m,i)=> (
                  <div key={i} className="mb-2">
                    <div className="mb-1">{i+1}. {m.q}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {m.choices.map((c,j)=> (
                        <label key={j} className="flex items-center gap-2 border rounded p-2">
                          <input type="radio" name={`mcq-${q.id}-${i}`} value={j} onChange={e=>setAns(`mcq-${q.id}-${i}`, e.target.value)} />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="font-medium mb-2">Short Answer</div>
                {q.short?.map((s,i)=> (
                  <div key={i} className="mb-3">
                    <div className="mb-1">{i+1}. {s.q}</div>
                    <textarea className="border rounded p-2 w-full" rows={2} placeholder="Your answer..." />
                    <div className="text-xs text-gray-500 mt-1">Rubric: {s.rubric}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded border text-sm">
                <div><strong>Score:</strong> {res.score}/{res.total}</div>
                {res.report.length>0 && <ul className="list-disc pl-5 mt-1">{res.report.map((r,i)=>(<li key={i}>{r}</li>))}</ul>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
