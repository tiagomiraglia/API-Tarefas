/**
 * Formata número de telefone brasileiro
 * @param phone Número bruto (ex: 5511999998888)
 * @returns Número formatado (ex: +55 (11) 99999-8888)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato: 5511999998888 (13 dígitos com código do país)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.substring(2, 4);
    const firstPart = cleaned.substring(4, 9);
    const secondPart = cleaned.substring(9);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }
  
  // Formato: 551199998888 (12 dígitos com código do país)
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    const ddd = cleaned.substring(2, 4);
    const firstPart = cleaned.substring(4, 8);
    const secondPart = cleaned.substring(8);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }
  
  // Formato: 11999998888 (11 dígitos)
  if (cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const firstPart = cleaned.substring(2, 7);
    const secondPart = cleaned.substring(7);
    return `(${ddd}) ${firstPart}-${secondPart}`;
  }
  
  // Formato: 1199998888 (10 dígitos)
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const firstPart = cleaned.substring(2, 6);
    const secondPart = cleaned.substring(6);
    return `(${ddd}) ${firstPart}-${secondPart}`;
  }
  
  // Formato: 999998888 (9 dígitos - apenas o número)
  if (cleaned.length === 9) {
    const firstPart = cleaned.substring(0, 5);
    const secondPart = cleaned.substring(5);
    return `${firstPart}-${secondPart}`;
  }
  
  // Formato: 99998888 (8 dígitos - apenas o número)
  if (cleaned.length === 8) {
    const firstPart = cleaned.substring(0, 4);
    const secondPart = cleaned.substring(4);
    return `${firstPart}-${secondPart}`;
  }
  
  // Retorna o número original se não se encaixar em nenhum padrão
  return phone;
}

/**
 * Extrai apenas os números de um telefone
 * @param phone Número com formatação
 * @returns Apenas dígitos
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Valida se é um número de telefone brasileiro válido
 * @param phone Número a validar
 * @returns true se válido
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  
  // Deve ter entre 8 e 13 dígitos
  if (cleaned.length < 8 || cleaned.length > 13) return false;
  
  // Se começar com 55, deve ter 12 ou 13 dígitos
  if (cleaned.startsWith('55')) {
    return cleaned.length === 12 || cleaned.length === 13;
  }
  
  // Se não começar com 55, deve ter 10 ou 11 dígitos (com DDD) ou 8-9 (sem DDD)
  return [8, 9, 10, 11].includes(cleaned.length);
}
