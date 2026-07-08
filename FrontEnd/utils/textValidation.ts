// Regex que captura caracteres invisíveis (zero-width, controlo, fillers, etc.)
// Inclui: Zero-width spaces, BOM, Soft hyphens, Directional marks, Hangul fillers, Braille blank
export const INVISIBLE_CHARS_REGEX =
  /[\u200B-\u200D\uFEFF\u00AD\u2060-\u2064\u180E\u2028-\u202E\uFFF9-\uFFFB\u200E\u200F\u3164\u115F\u1160\uFFA0\u2800]/g;

/**
 * Remove todos os caracteres invisíveis de uma string.
 * @param value A string original.
 * @returns A string limpa.
 */
export const stripInvisibleChars = (value: string): string => {
  return value.replace(INVISIBLE_CHARS_REGEX, '');
};

/**
 * Verifica se a string original contém caracteres invisíveis.
 * @param value A string a verificar.
 * @returns true se contiver caracteres invisíveis, false caso contrário.
 */
export const hasInvisibleChars = (value: string): boolean => {
  return INVISIBLE_CHARS_REGEX.test(value);
};

/**
 * Verifica se o texto é válido (não está vazio nem contém apenas caracteres invisíveis/espaços).
 * @param value A string a validar.
 * @returns true se o texto for válido.
 */
export const isValidText = (value: string): boolean => {
  const cleaned = stripInvisibleChars(value).trim();
  return cleaned.length > 0;
};

/**
 * Valida um NIF (Número de Identificação Fiscal) português.
 * Verifica:
 *   1. Tem exatamente 9 dígitos.
 *   2. O primeiro dígito é um prefixo válido (1, 2, 3, 5, 6, 8, 9).
 *   3. O dígito de controlo (9º) corresponde ao cálculo de checksum.
 *
 * @param nif O NIF como string ou número.
 * @returns true se o NIF for válido, false caso contrário.
 */
export const isValidNIF = (nif: string | number | null | undefined): boolean => {
  if (nif === null || nif === undefined) return false;

  const sNif = String(nif).trim();

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(sNif)) return false;

  // Valid first-digit prefixes per Portuguese tax authority rules
  const validPrefixes = ['1', '2', '3', '5', '6', '8', '9'];
  if (!validPrefixes.includes(sNif[0])) return false;

  // Checksum: multiply first 8 digits by weights 9..2, sum, mod 11
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(sNif[i], 10) * (9 - i);
  }
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;

  return calculatedCheckDigit === parseInt(sNif[8], 10);
};
