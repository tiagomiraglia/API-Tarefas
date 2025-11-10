import React, { useEffect, useState } from 'react';

interface Aviso {
  id: number;
  mensagem: string;
  ativo: boolean;
  data_criacao: string;
  data_expiracao: string | null;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function AvisoGlobal() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/avisos/ativo`)
      .then(res => res.json())
      .then(data => {
        // Backend retorna array de avisos, pegamos o primeiro global
        const avisos = Array.isArray(data.avisos) ? data.avisos : [];
        const avisoGlobal = avisos.find((a: any) => !a.destinatario_id && !a.destinatario_nivel);
        setAviso(avisoGlobal || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !aviso || !aviso.ativo) return null;

  // Se houver data de expiração e já passou, não exibe
  if (aviso.data_expiracao && new Date(aviso.data_expiracao) < new Date()) return null;

  return (
    <div style={{
      background: '#ffe066',
      color: '#333',
      padding: '12px 24px',
      textAlign: 'center',
      fontWeight: 600,
      fontSize: 18,
      borderBottom: '2px solid #ffb700',
      zIndex: 1000
    }}>
      {aviso.mensagem}
    </div>
  );
}
