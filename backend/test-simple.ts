/**
 * Script de teste direto do WhatsApp - versão simplificada usando whatsapp-web.js
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = path.join(__dirname, 'test_auth_simple');

async function testWhatsAppSimple() {
  console.log('🧪 Teste SIMPLES de conexão WhatsApp com whatsapp-web.js...\n');

  // Criar diretório de teste
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  try {
    // Criar cliente WhatsApp
    const client = new Client({
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      authStrategy: new LocalAuth({ clientId: 'test-simple', dataPath: AUTH_DIR })
    });

    console.log('🔌 Cliente WhatsApp criado\n');

    // Event handlers
    client.on('qr', async (qr: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}]  QR RECEBIDO (${qr.length} chars)`);

      // GERAR IMAGEM DO QR CODE
      try {
        const qrImagePath = './whatsapp-qr.png';
        await QRCode.toFile(qrImagePath, qr, {
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 300,
          margin: 2
        });

        console.log(`[${timestamp}] 🖼️ QR CODE SALVO EM: ${qrImagePath}`);
        console.log(`[${timestamp}] 📂 ABRA O ARQUIVO whatsapp-qr.png E ESCANEIE COM O WHATSAPP!`);
        console.log(`[${timestamp}] 🔗 Ou abra: file://${process.cwd()}/whatsapp-qr.png\n`);

      } catch (err) {
        console.error(`[${timestamp}] ❌ Erro ao gerar imagem QR:`, err);
      }
    });

    client.on('ready', () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🎉 WHATSAPP CONECTADO COM SUCESSO!`);
      console.log(`[${timestamp}] 👤 Cliente info:`, client.info);
      console.log(`[${timestamp}] ✅ PRONTO PARA USAR!\n`);

      // Aguardar um pouco e encerrar
      setTimeout(() => {
        console.log(`[${timestamp}] 🏁 Teste concluído com sucesso!`);
        client.destroy();
        process.exit(0);
      }, 5000);
    });

    client.on('auth_failure', (msg: any) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ❌ FALHA DE AUTENTICAÇÃO:`, msg);
    });

    client.on('disconnected', (reason: any) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🔌 DESCONECTADO:`, reason);
    });

    console.log('⏳ Inicializando cliente...\n');

    await client.initialize();

    console.log('⏳ Aguardando eventos...\n');

    // Timeout de segurança
    setTimeout(() => {
      console.log('\n⏰ Timeout - teste não concluído em 3 minutos');
      client.destroy();
      process.exit(1);
    }, 180000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executar teste
testWhatsAppSimple();