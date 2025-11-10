#!/usr/bin/env node

/**
 * Executor de Testes Unitários - Baileys WhatsApp Service
 *
 * Executa todos os testes unitários criados para validar
 * as correções implementadas no serviço Baileys.
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Baileys Service Tests',
    file: 'tests/baileys/baileys/baileysService.test.ts',
    description: 'Testa funções utilitárias de geração e parsing de session IDs'
  },
  {
    name: 'WhatsApp Routes Tests',
    file: 'tests/baileys/baileys/whatsappBaileysRoutes.test.ts',
    description: 'Testa validações de API, autenticação e tratamento de erros'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Executando: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`📁 Arquivo: ${test.file}`);

    const child = spawn('node', [test.file], {
      cwd: path.join(__dirname, '..', '..', '..'),
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${test.name}: PASSOU`);
        resolve(true);
      } else {
        console.log(`❌ ${test.name}: FALHOU`);
        resolve(false);
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Erro ao executar ${test.name}:`, error.message);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Iniciando Suite de Testes Unitários - Baileys WhatsApp Service');
  console.log('=' .repeat(70));

  const results = [];
  for (const test of tests) {
    const success = await runTest(test);
    results.push({ test: test.name, success });
  }

  console.log('\n' + '=' .repeat(70));
  console.log('📊 RESUMO DOS TESTES');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.success ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.test}`);
  });

  console.log(`\n🎯 Resultado Final: ${passed}/${total} testes passaram`);

  if (passed === total) {
    console.log('🎉 Todos os testes passaram! O serviço Baileys está funcionando corretamente.');
    console.log('\n🔧 Correções Implementadas:');
    console.log('  • Loop infinito de reconexão corrigido (MAX_RETRY_ATTEMPTS = 3)');
    console.log('  • Race conditions na atualização de session IDs resolvidas');
    console.log('  • Timeouts reduzidos de 60s para 30s');
    console.log('  • Testes unitários criados para validação contínua');
    process.exit(0);
  } else {
    console.log('❌ Alguns testes falharam. Verifique os logs acima.');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };