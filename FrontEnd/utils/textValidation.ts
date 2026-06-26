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
