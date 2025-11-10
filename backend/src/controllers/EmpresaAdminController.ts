import { Request, Response } from 'express';
import pool from '../database/database';
import bcrypt from 'bcryptjs';

export class EmpresaAdminController {
  // POST /api/auth/empresa-admin
  async criarEmpresaEAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { nomeEmpresa, cnpj, nomeAdmin, emailAdmin, senhaAdmin } = req.body;
      if (!nomeEmpresa || !cnpj || !nomeAdmin || !emailAdmin || !senhaAdmin) {
        res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        return;
      }
      // Cria empresa
      let empresaId;
      try {
        const empresaResult = await pool.query(
          'INSERT INTO "Empresa" (nome, cnpj) VALUES ($1, $2) RETURNING id',
          [nomeEmpresa, cnpj]
        );
        empresaId = empresaResult.rows[0].id;
      } catch (err: any) {
        if (err.code === '23505') {
          res.status(400).json({ message: 'CNPJ já cadastrado.' });
          return;
        }
        throw err;
      }
      // Cria usuário admin
      const hash = await bcrypt.hash(senhaAdmin, 10);
  await pool.query(
  'INSERT INTO "Usuario" (nome, email, senha, empresa_id, is_superuser, nivel) VALUES ($1, $2, $3, $4, $5, $6)',
    [nomeAdmin, emailAdmin, hash, empresaId, false, 'admin']
  );
      res.status(201).json({ message: 'Empresa e usuário administrador cadastrados com sucesso!' });
    } catch (error) {
      console.error('Erro ao cadastrar empresa/admin:', error);
      res.status(500).json({ message: 'Erro ao cadastrar empresa/admin.' });
    }
  }
}
