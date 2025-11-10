import io from 'socket.io-client';
import { api } from './api';

type SocketIOSocket = ReturnType<typeof io>;

let singleton: SocketIOSocket | null = null;
let creating: Promise<SocketIOSocket> | null = null;

const defaultTryUrls = (): string[] => {
  const urls: string[] = [];
  try {
    let base = api.defaults.baseURL || '';
    base = base.replace(/\/(api)\/?$/i, '');
    if (base) urls.push(base);
  } catch (e) {
    // ignore
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    urls.push(window.location.origin.replace(/:\d+$/, ':4000'));
  }

  urls.push('http://localhost:4000');

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const idx = urls.indexOf('http://localhost:4000');
    if (idx > -1) urls.splice(idx, 1);
    urls.unshift('http://localhost:4000');
  }

  return urls;
};

const tryConnect = (base: string, token?: string, timeoutMs = 4000): Promise<SocketIOSocket> => {
  return new Promise((resolve, reject) => {
    const s = io(base, {
      autoConnect: false,
      transports: ['websocket'],
      path: '/socket.io',
      auth: token ? { token } : undefined,
    });

    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        s.close();
      } catch (e) {}
      reject(new Error('timeout'));
    }, timeoutMs);

    s.once('connect', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(s);
    });

    s.once('connect_error', (err: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        s.close();
      } catch (e) {}
      reject(err instanceof Error ? err : new Error(String(err)));
    });

    try {
      s.open();
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        try {
          s.close();
        } catch (ee) {}
        reject(e);
      }
    }
  });
};

export async function getSocket(token?: string): Promise<SocketIOSocket> {
  if (singleton && singleton.connected) return singleton;
  if (creating) return creating;

  creating = (async () => {
    const urls = defaultTryUrls();
    let lastErr: any = null;
    for (const u of urls) {
      try {
        const s = await tryConnect(u, token, 4000);
        singleton = s;
        creating = null;
        return s;
      } catch (e) {
        lastErr = e;
        // console warn intentionally lightweight to avoid noise in prod
        console.warn('[Socket] tentativa em', u, 'falhou:', (e as any)?.message ?? e);
      }
    }
    creating = null;
    throw lastErr || new Error('Não foi possível conectar socket.io');
  })();

  return creating;
}

export function closeSocket() {
  if (singleton) {
    try {
      singleton.close();
    } catch (e) {}
    singleton = null;
  }
}

export function getSingleton() {
  return singleton;
}
