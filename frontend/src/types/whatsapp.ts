export interface WhatsAppConversa {
  id: string;
  name: string;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
  unreadCount: number;
  isGroup: boolean;
  timestamp: number;
  cartao?: {
    id: number;
    titulo: string;
    coluna: string;
    aba: string;
    atendente: {
      id: number;
      nome: string;
      iniciais: string;
    } | null;
  } | null;
}

export interface WhatsAppMensagem {
  id: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  from: string;
  hasMedia: boolean;
  type: string;
  media?: {
    url: string;
    mimetype?: string;
    fileName?: string;
    fileLength?: number;
    [key: string]: any;
  };
}
