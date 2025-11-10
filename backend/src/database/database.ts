import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Carrega variáveis de ambiente padrão
dotenv.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
