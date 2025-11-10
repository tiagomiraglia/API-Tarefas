/**
 * Utilitários para formatação de números de telefone brasileiros
 */
/**
 * Formata número de telefone brasileiro
 * @param phone Número bruto (ex: 5511999998888)
 * @returns Número formatado (ex: +55 (11) 99999-8888)
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Extrai apenas os números de um telefone
 * @param phone Número com formatação
 * @returns Apenas dígitos
 */
export declare function cleanPhoneNumber(phone: string): string;
/**
 * Valida se é um número de telefone brasileiro válido
 * @param phone Número a validar
 * @returns true se válido
 */
export declare function isValidBrazilianPhone(phone: string): boolean;
//# sourceMappingURL=phoneFormatter.d.ts.map