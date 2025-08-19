/**
 * Helpers de Formatação
 *
 * Funções utilitárias para formatação de dados e strings.
 */

/**
 * Capitalizar primeira letra de uma string
 *
 * @param str - String a ser capitalizada
 * @returns String com primeira letra maiúscula
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
