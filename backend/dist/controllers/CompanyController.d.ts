import { Request, Response } from 'express';
export declare class CompanyController {
    getCompanyById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateCompany(req: Request, res: Response): Promise<void>;
    suspendCompany(req: Request, res: Response): Promise<void>;
    reactivateCompany(req: Request, res: Response): Promise<void>;
    deleteCompany(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=CompanyController.d.ts.map