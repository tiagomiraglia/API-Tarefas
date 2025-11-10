/**
 * Testes Unitários para Baileys Service
 *
 * Testa as funcionalidades principais do serviço de WhatsApp Baileys,
 * incluindo geração de session IDs, parsing, validações e tratamento de erros.
 */

// Funções copiadas do serviço para teste independente
function generateSessionId(empresaId: number, telefone?: string): string {
  if (telefone) {
    const cleanPhone = telefone.replace(/\D/g, '');
    return `empresa_${empresaId}_${cleanPhone}`;
  }
  // Sessão temporária até escanear QR Code
  return `empresa_${empresaId}_temp_${Date.now()}`;
}

function parseSessionId(sessionId: string): { empresaId: number; telefone: string } | null {
  // Aceita formato normal e temporário
  const match = sessionId.match(/^empresa_(\d+)_(\d+)$/);
  if (match) {
    return {
      empresaId: parseInt(match[1]),
      telefone: match[2]
    };
  }
  const tempMatch = sessionId.match(/^empresa_(\d+)_temp_\d+$/);
  if (tempMatch) {
    return {
      empresaId: parseInt(tempMatch[1]),
      telefone: 'temp'
    };
  }
  return null;
}

/**
 * Testes simples de validação para generateSessionId
 */
function testGenerateSessionId() {
  console.log('🧪 Testando generateSessionId...');

  // Teste 1: ID com telefone válido
  const result1 = generateSessionId(1, '5511999999999');
  if (result1 !== 'empresa_1_5511999999999') {
    throw new Error(`Teste 1 falhou: esperava 'empresa_1_5511999999999', recebeu '${result1}'`);
  }
  console.log('✅ Teste 1 passou: ID com telefone válido');

  // Teste 2: ID temporário sem telefone
  const result2 = generateSessionId(1);
  if (!result2.match(/^empresa_1_temp_\d+$/)) {
    throw new Error(`Teste 2 falhou: esperava formato temp, recebeu '${result2}'`);
  }
  console.log('✅ Teste 2 passou: ID temporário sem telefone');

  // Teste 3: Limpeza de caracteres não numéricos
  const result3 = generateSessionId(1, '(55) 11 99999-9999');
  if (result3 !== 'empresa_1_5511999999999') {
    throw new Error(`Teste 3 falhou: esperava 'empresa_1_5511999999999', recebeu '${result3}'`);
  }
  console.log('✅ Teste 3 passou: Limpeza de caracteres não numéricos');
}

/**
 * Testes simples de validação para parseSessionId
 */
function testParseSessionId() {
  console.log('🧪 Testando parseSessionId...');

  // Teste 1: Parsing de ID normal
  const result1 = parseSessionId('empresa_1_5511999999999');
  if (!result1 || result1.empresaId !== 1 || result1.telefone !== '5511999999999') {
    throw new Error(`Teste 1 falhou: parsing incorreto`);
  }
  console.log('✅ Teste 1 passou: Parsing de ID normal');

  // Teste 2: Parsing de ID temporário
  const result2 = parseSessionId('empresa_5_temp_123456789');
  if (!result2 || result2.empresaId !== 5 || result2.telefone !== 'temp') {
    throw new Error(`Teste 2 falhou: parsing de temp incorreto`);
  }
  console.log('✅ Teste 2 passou: Parsing de ID temporário');

  // Teste 3: ID inválido retorna null
  const result3 = parseSessionId('invalid_id');
  if (result3 !== null) {
    throw new Error(`Teste 3 falhou: esperava null, recebeu ${result3}`);
  }
  console.log('✅ Teste 3 passou: ID inválido retorna null');
}

/**
 * Função principal de execução dos testes
 */
function runTests() {
  console.log('🚀 Iniciando testes unitários do Baileys Service...\n');

  try {
    testGenerateSessionId();
    console.log('');
    testParseSessionId();

    console.log('\n🎉 Todos os testes passaram! ✅');
    return true;
  } catch (error) {
    console.error('\n❌ Teste falhou:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Executar testes diretamente
const success = runTests();
process.exit(success ? 0 : 1);

export { runTests, testGenerateSessionId, testParseSessionId };