"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Carrega variáveis de ambiente padrão
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.default = pool;
//# sourceMappingURL=database.js.map