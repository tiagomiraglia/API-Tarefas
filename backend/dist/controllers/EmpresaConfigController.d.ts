import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class EmpresaConfigController {
    getConfig(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateConfig(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=EmpresaConfigController.d.ts.map