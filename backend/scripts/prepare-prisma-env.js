// Script para garantir que o Prisma use .env.local se existir, senão .env
const fs = require('fs');
const path = require('path');

const envLocal = path.resolve(__dirname, '../.env.local');
const env = path.resolve(__dirname, '../.env');
const prismaEnv = path.resolve(__dirname, '../.env.prisma');

if (fs.existsSync(envLocal)) {
  fs.copyFileSync(envLocal, prismaEnv);
  console.log('.env.local copiado para .env.prisma');
} else if (fs.existsSync(env)) {
  fs.copyFileSync(env, prismaEnv);
  console.log('.env copiado para .env.prisma');
} else {
  console.warn('Nenhum arquivo .env ou .env.local encontrado.');
}
