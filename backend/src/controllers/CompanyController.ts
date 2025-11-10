import { Request, Response } from 'express';
import pool from '../database/database';

export class CompanyController {
  // GET /api/empresas/:id
  async getCompanyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT id, nome, cnpj, created_at, status FROM empresas WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Empresa não encontrada' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar empresa' });
    }
  }

  // PUT /api/empresas/:id
  async updateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, cnpj } = req.body;
      await pool.query('UPDATE empresas SET nome = $1, cnpj = $2 WHERE id = $3', [nome, cnpj, id]);
      res.json({ message: 'Empresa atualizada com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar empresa' });
    }
  }

  // PATCH /api/empresas/:id/suspender
  async suspendCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('UPDATE empresas SET status = $1 WHERE id = $2', ['suspenso', id]);
      res.json({ message: 'Empresa suspensa com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao suspender empresa' });
    }
  }

  // PATCH /api/empresas/:id/reativar
  async reactivateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('UPDATE empresas SET status = $1 WHERE id = $2', ['ativo', id]);
      res.json({ message: 'Empresa reativada com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao reativar empresa' });
    }
  }

  // DELETE /api/empresas/:id
  async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
      res.json({ message: 'Empresa excluída com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir empresa' });
    }
  }
}
