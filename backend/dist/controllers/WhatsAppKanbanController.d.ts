import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare class WhatsAppKanbanController {
    private readonly WPPCONNECT_URL;
    getStatus(req: AuthRequest, res: Response): Promise<void>;
    connect(req: AuthRequest, res: Response): Promise<void>;
    reconnect(req: AuthRequest, res: Response): Promise<void>;
    cleanSession(req: AuthRequest, res: Response): Promise<void>;
    getConversas(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMensagens(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    enviarMensagem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    marcarComoLido(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    sincronizarMensagens(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    webhookMensagem(req: Request, res: Response): Promise<void>;
    criarCartao(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    importarHistorico(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private getNextPositionInColumn;
}
export {};
//# sourceMappingURL=WhatsAppKanbanController.d.ts.map