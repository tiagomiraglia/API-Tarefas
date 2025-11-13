/**
 * Script de teste simples para WhatsApp usando whatsapp-web.js
 * Executar com: npx ts-node test-whatsapp.ts
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR_TEST = path.join(__dirname, 'test_auth');

async function testWhatsAppConnection() {
  console.log('🧪 Iniciando teste de conexão WhatsApp com whatsapp-web.js...');

  // Criar diretório de teste
  if (!fs.existsSync(AUTH_DIR_TEST)) {
    fs.mkdirSync(AUTH_DIR_TEST, { recursive: true });
  }

  try {
    // Criar cliente WhatsApp
    const client = new Client({
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      authStrategy: new LocalAuth({ clientId: 'test-whatsapp', dataPath: AUTH_DIR_TEST })
    });

    console.log('🔌 Cliente WhatsApp criado');

    // Event handlers
    client.on('qr', async (qr: string) => {
      console.log('📱 QR Code recebido!');
      console.log(`📱 QR String: ${qr.substring(0, 50)}...`);

      // Salvar QR como imagem
      try {
        await QRCode.toFile('./test-qr.png', qr, {
          color: { dark: '#000000', light: '#FFFFFF' },
          width: 300
        });
        console.log('🖼️ QR Code salvo em: ./test-qr.png');
        console.log('📂 Abra o arquivo e escaneie com o WhatsApp');
      } catch (err) {
        console.error('❌ Erro ao salvar QR:', err);
      }
    });

    client.on('ready', () => {
      console.log('🎉 Conexão estabelecida com sucesso!');
      console.log('✅ Teste concluído - WhatsApp conectado!');

      // Aguardar um pouco e encerrar
      setTimeout(() => {
        client.destroy();
        process.exit(0);
      }, 3000);
    });

    client.on('auth_failure', (msg: any) => {
      console.log('❌ Falha de autenticação:', msg);
    });

    client.on('disconnected', (reason: any) => {
      console.log('🔌 Desconectado:', reason);
    });

    console.log('⏳ Inicializando cliente...');
    await client.initialize();

    // Aguardar por 2 minutos
    setTimeout(() => {
      console.log('⏰ Timeout - teste não concluído em 2 minutos');
      client.destroy();
      process.exit(1);
    }, 120000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executar teste
testWhatsAppConnection();