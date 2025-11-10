import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function getUserId() {
  // Tenta pegar o id do usuário do localStorage (ajuste conforme seu sistema)
  return localStorage.getItem('user_id') || localStorage.getItem('usuario_id') || '';
}

function getAvisosVistos() {
  const userId = getUserId();
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(`avisos_vistos_${userId}`) || '[]');
  } catch {
    return [];
  }
}

export function marcarAvisosComoVistos(ids: number[]) {
  const userId = getUserId();
  if (!userId) return;
  const vistos = new Set(getAvisosVistos());
  ids.forEach(id => vistos.add(id));
  localStorage.setItem(`avisos_vistos_${userId}`, JSON.stringify(Array.from(vistos)));
}

export default function useAvisoAtivoCount() {
  const [count, setCount] = useState(0);

  // Permite forçar atualização externa
  (window as any).atualizarAvisoAtivoCount = () => {
    fetchCount();
  };

  async function fetchCount() {
    try {
      const res = await fetch(`${API_URL}/api/avisos/ativo`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      // Backend já retorna avisos filtrados corretamente, não precisa filtrar novamente
      const avisos = Array.isArray(data.avisos) ? data.avisos : [];
      const vistos = new Set(getAvisosVistos());
      const naoVistos = avisos.filter((a: { id: number }) => !vistos.has(a.id));
      setCount(naoVistos.length);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    let isMounted = true;
    fetchCount();
    const interval = setInterval(() => { if (isMounted) fetchCount(); }, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return count;
}
