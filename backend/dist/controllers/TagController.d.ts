import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class TagController {
    listTags(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createTag(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateTag(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteTag(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=TagController.d.ts.map