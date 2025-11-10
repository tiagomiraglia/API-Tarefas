import { Request, Response } from 'express';
export declare class AvisoController {
    getAvisoAtivo(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    registrarVisualizacao(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getVisualizacoes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    setAviso(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    listAvisos(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    editAviso(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    suspendAviso(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAviso(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AvisoController.d.ts.map