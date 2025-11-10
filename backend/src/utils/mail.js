// Módulo de envio de e-mails (stub)
// Implemente aqui a lógica real de envio de e-mail conforme sua necessidade

module.exports = {
  sendMail: async function (to, subject, body) {
    // Exemplo: apenas loga o envio
    console.log(`[MAIL] Enviando e-mail para: ${to}, assunto: ${subject}`);
    // Aqui você pode integrar com nodemailer, SMTP, etc.
    return { success: true };
  }
};
