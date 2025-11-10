import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare class CartaoTransferenciaController {
    /**
     * Transferir cartão para outro atendente
     * POST /api/cartoes/:id/transferir
     */
    transferirCartao(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Buscar histórico de transferências de um cartão
     * GET /api/cartoes/:id/transferencias
     */
    getHistoricoTransferencias(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Estatísticas de transferências (apenas admin)
     * GET /api/transferencias/estatisticas
     */
    getEstatisticas(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Listar todas as transferências com filtros (apenas admin)
     * GET /api/transferencias
     */
    listarTransferencias(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export {};
//# sourceMappingURL=CartaoTransferenciaController.d.ts.map