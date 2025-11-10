"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require('multer');
// Armazena arquivos em memória para salvar como base64
const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.default = upload;
//# sourceMappingURL=upload.js.map