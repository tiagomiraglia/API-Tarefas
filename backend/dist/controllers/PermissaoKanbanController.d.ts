import { Request, Response } from 'express';
export declare class PermissaoKanbanController {
    listByUsuario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listByAbaColuna(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=PermissaoKanbanController.d.ts.map