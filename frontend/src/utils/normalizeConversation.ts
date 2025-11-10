// Utilities to normalize incoming realtime conversation payloads.
export function canonicalizeId(raw?: any): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw);
  // If contains @ (whatsapp jid), prefer the part before @
  if (s.includes('@')) return s.split('@')[0];
  // Prefer pure digits when possible
  const digits = s.replace(/\D/g, '');
  if (digits) return digits;
  // fallback to original string
  return s;
}

export function normalizeRealtimePayload(payload: any) {
  if (!payload) return null;
  // Many servers wrap payloads in a `response` property
  const p = payload.response || payload;

  const rawId = p.id || p.chatId || p.from || p.sender || p.clientId || p.to || p.fromMe || p.source;
  const id = canonicalizeId(rawId);

  const message = p.body || p.text || p.message || p.content || (Array.isArray(p) && p[0] && p[0].body) || '';
  const ts = p.timestamp || p.time || p.t || p.ts || (p.date ? new Date(p.date).toISOString() : undefined);

  return {
    id,
    lastMessage: message,
    timestamp: ts,
    raw: payload,
    original: p
  };
}

export default {
  canonicalizeId,
  normalizeRealtimePayload
};
