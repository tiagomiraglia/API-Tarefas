import { Request, Response } from 'express';
export declare class AuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
    verificarCodigo(req: Request, res: Response): Promise<void>;
    recuperacao(req: Request, res: Response): Promise<void>;
    resetarSenha(req: Request, res: Response): Promise<void>;
    resetarSenhaTemporaria(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map