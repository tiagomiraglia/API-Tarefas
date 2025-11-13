import api from './api';

export async function createWhatsappSession(telefone?: string) {
  const res = await api.post('/whatsapp/sessions', telefone ? { telefone } : {});
  return res.data;
}

export async function getWhatsappSessionQR(session_id: string) {
  const res = await api.get(`/whatsapp/sessions/${session_id}/qr`);
  return res.data;
}

export async function getWhatsappSessionStatus(session_id: string) {
  const res = await api.get(`/whatsapp/sessions/${session_id}/status`);
  return res.data;
}

export async function disconnectWhatsappSession(session_id: string) {
  const res = await api.delete(`/whatsapp/sessions/${session_id}`);
  return res.data;
}

export async function sendWhatsappMessage(session_id: string, to: string, message: string) {
  const res = await api.post(`/whatsapp/sessions/${session_id}/send`, { to, message });
  return res.data;
}
