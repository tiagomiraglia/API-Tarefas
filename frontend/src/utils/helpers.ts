export const maskPhoneNumber = (phone?: string | null) => {
  if (!phone) return '';
  const s = String(phone).replace(/[^0-9]/g, '');
  if (s.length <= 4) return s;
  // mask last 4 digits
  return s.replace(/(\d+)(\d{4})$/, (m, a, b) => a.replace(/\d/g, '*') + b);
};

export const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (seed?: string | number) => {
  const s = String(seed || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const h = s % 360;
  return `hsl(${h} 70% 45%)`;
};

export const formatTimeOnly = (iso?: string | number | Date) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
