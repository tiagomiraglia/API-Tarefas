export function requireAdminOrSuperuser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.is_superuser && req.user.nivel !== 'admin')) {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' });
  }
  next();
}
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

export function requireSuperuser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.is_superuser) {
    return res.status(403).json({ message: 'Acesso restrito ao superusuário' });
  }
  next();
}
