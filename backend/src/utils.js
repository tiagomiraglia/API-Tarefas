// Utilitário para gerar tokens de verificação e manipular datas
const crypto = require('crypto');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('America/Sao_Paulo');

function generateToken(length = 6) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

function now() {
  return dayjs().tz().format();
}

module.exports = { generateToken, now };
