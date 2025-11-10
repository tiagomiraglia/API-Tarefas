const multer = require('multer');

// Armazena arquivos em memória para salvar como base64
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
