export declare function requireAdminOrSuperuser(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
}
export declare function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireSuperuser(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map