"use client";
import { useState } from 'react';

export default function PipelineTester() {
  const [text, setText] = useState('Streetlight broken near 5th Ave');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'document', data: text, language: lang }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Pipeline failed');
      setResult(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Resident message</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-3">
        <label className="text-sm">Language</label>
        <select className="border rounded p-1" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="ar">Arabic</option>
          <option value="hi">Hindi</option>
          <option value="ur">Urdu</option>
        </select>
        <button
          className="px-3 py-2 bg-green-600 text-white rounded"
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Running…' : 'Run Pipeline'}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="text-sm space-y-2">
          <div>
            <div className="font-medium">Translation</div>
            <div className="border rounded p-2 whitespace-pre-wrap">{result.translation}</div>
          </div>
          <div>
            <div className="font-medium">Audit</div>
            <pre className="border rounded p-2 overflow-auto max-h-64">{JSON.stringify(result.audit, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}