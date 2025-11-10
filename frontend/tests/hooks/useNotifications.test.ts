// ⚠️ Este arquivo requer dependências de teste não instaladas ainda
// Para executar estes testes, instale as dependências:
// npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

// import { renderHook, waitFor } from '@testing-library/react';
// import { useNotifications } from '../../../src/hooks/useNotifications';
// import io from 'socket.io-client';

// Mock do socket.io-client
// jest.mock('socket.io-client');

// const mockIo = io as jest.MockedFunction<typeof io>;

// TODOS OS TESTES ABAIXO ESTÃO COMENTADOS ATÉ AS DEPENDÊNCIAS SEREM INSTALADAS
/*

describe('useNotifications Hook', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    mockIo.mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve conectar ao servidor WebSocket quando userId é fornecido', () => {
    const userId = 123;
    
    renderHook(() => useNotifications(userId));

    expect(mockIo).toHaveBeenCalledWith('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nova-transferencia', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('cartao-updated', expect.any(Function));
  });

  it('deve emitir subscribe-user quando conectado', () => {
    const userId = 123;
    
    renderHook(() => useNotifications(userId));

    // Simular conexão
    const connectCallback = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )?.[1];

    connectCallback();

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe-user', userId);
  });

  it('deve atualizar estado connected quando conectar', async () => {
    const { result } = renderHook(() => useNotifications(123));

    // Estado inicial
    expect(result.current.connected).toBe(false);

    // Simular conexão
    const connectCallback = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )?.[1];

    connectCallback();

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it('deve adicionar notificação quando receber nova transferência', async () => {
    const { result } = renderHook(() => useNotifications(123));

    const mockNotification = {
      type: 'transferencia',
      timestamp: new Date().toISOString(),
      data: {
        cartaoId: 1,
        cartaoTitulo: 'Cartão Teste',
        usuarioOrigem: {
          id: 456,
          nome: 'João Silva',
        },
        observacao: 'Transferindo para você',
      },
    };

    // Simular recebimento de notificação
    const transferCallback = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'nova-transferencia'
    )?.[1];

    transferCallback(mockNotification);

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toEqual(mockNotification);
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it('deve marcar notificação como lida', async () => {
    const { result } = renderHook(() => useNotifications(123));

    const mockNotification = {
      type: 'transferencia',
      timestamp: new Date().toISOString(),
      data: {
        cartaoId: 1,
        cartaoTitulo: 'Cartão Teste',
        usuarioOrigem: { id: 456, nome: 'João' },
      },
    };

    // Adicionar notificação
    const transferCallback = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'nova-transferencia'
    )?.[1];
    transferCallback(mockNotification);

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });

    // Marcar como lida
    result.current.markAsRead(0);

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('deve marcar todas as notificações como lidas', async () => {
    const { result } = renderHook(() => useNotifications(123));

    const transferCallback = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'nova-transferencia'
    )?.[1];

    // Adicionar múltiplas notificações
    transferCallback({ type: 'transferencia', data: { cartaoId: 1 } });
    transferCallback({ type: 'transferencia', data: { cartaoId: 2 } });
    transferCallback({ type: 'transferencia', data: { cartaoId: 3 } });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3);
    });

    // Marcar todas como lidas
    result.current.markAllAsRead();

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('deve desconectar ao desmontar', () => {
    const userId = 123;
    const { unmount } = renderHook(() => useNotifications(userId));

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe-user', userId);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('não deve se inscrever se userId não for fornecido', () => {
    renderHook(() => useNotifications());

    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'subscribe-user',
      expect.anything()
    );
  });
});
*/

// Fim do arquivo - Testes comentados até instalação das dependências
export {};
