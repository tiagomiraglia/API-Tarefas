import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class UserController {
    updateUser(req: Request & {
        files?: any;
    }, res: Response): Promise<void>;
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
    reactivateUser(req: Request, res: Response): Promise<void>;
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createTeamUser(req: AuthRequest, res: Response): Promise<void>;
    resendTempPassword(req: AuthRequest, res: Response): Promise<void>;
    suspendUser(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map