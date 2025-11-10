// Script para copiar .env.local para .env automaticamente no desenvolvimento
const fs = require('fs');
const path = require('path');

const envLocal = path.resolve(__dirname, '../.env.local');
const env = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocal)) {
  fs.copyFileSync(envLocal, env);
  console.log('.env.local copiado para .env');
} else {
  console.warn('Arquivo .env.local não encontrado.');
}
