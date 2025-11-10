import { Request, Response } from 'express';
import { CartaoTransferenciaController } from '../../../src/controllers/CartaoTransferenciaController';

// Declare Jest globals
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };
}

// Mock do Prisma
const mockPrisma: any = {
  cartao: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  cartaoTransferencia: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  usuario: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
};

// Mock do notification service
jest.mock('../../../src/services/notificationService', () => ({
  notifyTransferencia: jest.fn(),
  notifyCartaoUpdate: jest.fn(),
}));

describe('CartaoTransferenciaController', () => {
  let controller: CartaoTransferenciaController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new CartaoTransferenciaController();
    (controller as any).prisma = mockPrisma;

    mockRequest = {
      params: {},
      body: {},
      user: {
        id: 1,
        nome: 'Teste User',
        email: 'teste@example.com',
        role: 'atendente',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('transferirCartao', () => {
    it('deve transferir cartão com sucesso para outro atendente', async () => {
      const cartaoId = 1;
      const usuarioDestinoId = 2;
      const observacao = 'Transferindo para você';

      mockRequest.params = { id: cartaoId.toString() };
      mockRequest.body = { usuario_destino_id: usuarioDestinoId, observacao };

      // Mock do cartão existente
      mockPrisma.cartao.findUnique.mockResolvedValue({
        id: cartaoId,
        titulo: 'Cartão Teste',
        atendente_responsavel_id: 1,
        coluna_id: 1,
      });

      // Mock do usuário destino
      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: usuarioDestinoId,
        nome: 'Usuário Destino',
        email: 'destino@example.com',
        role: 'atendente',
      });

      // Mock da transação
      const mockTransferencia = {
        id: 1,
        cartao_id: cartaoId,
        usuario_origem_id: 1,
        usuario_destino_id: usuarioDestinoId,
        observacao,
        created_at: new Date(),
      };

      mockPrisma.$transaction.mockResolvedValue({
        transferencia: mockTransferencia,
        cartao: { id: cartaoId, atendente_responsavel_id: usuarioDestinoId },
      });

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cartão transferido com sucesso',
        })
      );
    });

    it('deve retornar erro 404 se cartão não existir', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { usuario_destino_id: 2 };

      mockPrisma.cartao.findUnique.mockResolvedValue(null);

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cartão não encontrado',
        })
      );
    });

    it('deve retornar erro 403 se atendente não for responsável', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { usuario_destino_id: 2 };
      mockRequest.user = { id: 999, nome: 'Outro User', email: 'outro@test.com', role: 'atendente' };

      mockPrisma.cartao.findUnique.mockResolvedValue({
        id: 1,
        titulo: 'Cartão Teste',
        atendente_responsavel_id: 1, // Diferente do usuário logado
        coluna_id: 1,
      });

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Você não tem permissão para transferir este cartão',
        })
      );
    });

    it('deve retornar erro 404 se usuário destino não existir', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { usuario_destino_id: 999 };

      mockPrisma.cartao.findUnique.mockResolvedValue({
        id: 1,
        titulo: 'Cartão Teste',
        atendente_responsavel_id: 1,
        coluna_id: 1,
      });

      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuário destino não encontrado',
        })
      );
    });

    it('deve permitir admin transferir qualquer cartão', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { usuario_destino_id: 2 };
      mockRequest.user = { id: 999, nome: 'Admin User', email: 'admin@test.com', role: 'admin' };

      mockPrisma.cartao.findUnique.mockResolvedValue({
        id: 1,
        titulo: 'Cartão Teste',
        atendente_responsavel_id: 1, // Diferente do usuário logado
        coluna_id: 1,
      });

      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        nome: 'Usuário Destino',
        email: 'destino@example.com',
        role: 'atendente',
      });

      mockPrisma.$transaction.mockResolvedValue({
        transferencia: { id: 1 },
        cartao: { id: 1 },
      });

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro 400 se tentar transferir para si mesmo', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { usuario_destino_id: 1 }; // Mesmo ID do usuário logado

      mockPrisma.cartao.findUnique.mockResolvedValue({
        id: 1,
        titulo: 'Cartão Teste',
        atendente_responsavel_id: 1,
        coluna_id: 1,
      });

      await controller.transferirCartao(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Não é possível transferir um cartão para si mesmo',
        })
      );
    });
  });

  describe('getHistoricoTransferencias', () => {
    it('deve retornar histórico de transferências do cartão', async () => {
      const cartaoId = 1;
      mockRequest.params = { id: cartaoId.toString() };

      const mockHistorico = [
        {
          id: 1,
          cartao_id: cartaoId,
          usuario_origem_id: 1,
          usuario_destino_id: 2,
          observacao: 'Primeira transferência',
          created_at: new Date('2024-01-01'),
          usuarioOrigem: { id: 1, nome: 'User 1', foto: null },
          usuarioDestino: { id: 2, nome: 'User 2', foto: null },
        },
        {
          id: 2,
          cartao_id: cartaoId,
          usuario_origem_id: 2,
          usuario_destino_id: 3,
          observacao: 'Segunda transferência',
          created_at: new Date('2024-01-02'),
          usuarioOrigem: { id: 2, nome: 'User 2', foto: null },
          usuarioDestino: { id: 3, nome: 'User 3', foto: null },
        },
      ];

      mockPrisma.cartao.findUnique.mockResolvedValue({ id: cartaoId });
      mockPrisma.cartaoTransferencia.findMany.mockResolvedValue(mockHistorico);

      await controller.getHistoricoTransferencias(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          historico: mockHistorico,
          total: 2,
        })
      );
    });

    it('deve retornar erro 404 se cartão não existir', async () => {
      mockRequest.params = { id: '999' };
      mockPrisma.cartao.findUnique.mockResolvedValue(null);

      await controller.getHistoricoTransferencias(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getEstatisticas', () => {
    it('deve retornar estatísticas de transferências', async () => {
      const mockStats = {
        totalTransferencias: 10,
        transferenciasUltimos7Dias: 5,
        transferenciasUltimos30Dias: 8,
        usuariosMaisTransferem: [
          { usuario_origem_id: 1, nome: 'User 1', total: 5 },
          { usuario_origem_id: 2, nome: 'User 2', total: 3 },
        ],
        usuariosMaisRecebem: [
          { usuario_destino_id: 3, nome: 'User 3', total: 4 },
          { usuario_destino_id: 4, nome: 'User 4', total: 4 },
        ],
        transferenciasRecentes: [],
      };

      mockPrisma.cartaoTransferencia.findMany.mockResolvedValue([]);
      mockPrisma.cartaoTransferencia.groupBy
        .mockResolvedValueOnce([{ usuario_origem_id: 1, _count: { id: 5 } }])
        .mockResolvedValueOnce([{ usuario_destino_id: 3, _count: { id: 4 } }]);

      mockPrisma.usuario.findMany.mockResolvedValue([
        { id: 1, nome: 'User 1' },
        { id: 3, nome: 'User 3' },
      ]);

      await controller.getEstatisticas(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalTransferencias: expect.any(Number),
        })
      );
    });
  });

  describe('listarTransferencias', () => {
    it('deve listar todas as transferências com filtros', async () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      const mockTransferencias = [
        {
          id: 1,
          cartao_id: 1,
          usuario_origem_id: 1,
          usuario_destino_id: 2,
          observacao: 'Teste',
          created_at: new Date(),
          cartao: { id: 1, titulo: 'Cartão 1' },
          usuarioOrigem: { id: 1, nome: 'User 1' },
          usuarioDestino: { id: 2, nome: 'User 2' },
        },
      ];

      mockPrisma.cartaoTransferencia.findMany.mockResolvedValue(mockTransferencias);

      await controller.listarTransferencias(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transferencias: mockTransferencias,
          page: 1,
          limit: 10,
        })
      );
    });
  });
});
