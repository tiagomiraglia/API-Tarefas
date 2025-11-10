import React, { useState } from 'react';

export default function AvatarImageSearch({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function buscarImagens(ev: React.FormEvent) {
    ev.preventDefault();
    setErro('');
    setLoading(true);
    setResults([]);
    try {
      // DuckDuckGo Images API pública não oficial
      const res = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      setResults(data.results?.map((img: any) => img.image) || []);
    } catch (err) {
      setErro('Não foi possível buscar imagens. Tente outro termo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-2">
      <form className="input-group input-group-sm" onSubmit={buscarImagens}>
        <input type="text" className="form-control" placeholder="Buscar imagem (ex: professor)" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn btn-outline-secondary" type="submit" disabled={loading}>Buscar</button>
      </form>
      {erro && <div className="text-danger small mt-1">{erro}</div>}
      {loading && <div className="small text-muted mt-1">Buscando imagens...</div>}
      <div className="d-flex flex-wrap gap-2 mt-2">
        {results.map((url, i) => (
          <img
            key={i}
            src={url}
            alt="Sugestão"
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid #eee' }}
            onClick={() => onSelect(url)}
            title="Usar esta imagem"
          />
        ))}
      </div>
    </div>
  );
}
