import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare class KanbanController {
    listAbas(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createAba(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateAba(req: AuthRequest, res: Response): Promise<void>;
    deleteAba(req: AuthRequest, res: Response): Promise<void>;
    createColuna(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateColuna(req: AuthRequest, res: Response): Promise<void>;
    deleteColuna(req: AuthRequest, res: Response): Promise<void>;
    setColunaWhats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listCartoes(req: AuthRequest, res: Response): Promise<void>;
    getCartao(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createCartao(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateCartao(req: AuthRequest, res: Response): Promise<void>;
    moveCartao(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteCartao(req: AuthRequest, res: Response): Promise<void>;
    vincularWhatsApp(req: AuthRequest, res: Response): Promise<void>;
    desvincularWhatsApp(req: AuthRequest, res: Response): Promise<void>;
    getMonitoramento(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export {};
//# sourceMappingURL=KanbanController.d.ts.map