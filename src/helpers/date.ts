/**
 * Helpers de Data e Tempo
 *
 * Funções utilitárias para manipulação de datas e horários,
 * especialmente para conversões entre UTC e horário do Brasil.
 */

import { utcToZonedTime } from 'date-fns-tz';

/**
 * Obter hora atual do Brasil convertida para UTC para salvar no banco
 *
 * @returns Data/hora atual do Brasil convertida para UTC
 */
export const getBrazilTimeAsUTC = (): Date => {
  const timeZone = 'America/Sao_Paulo';
  const now = new Date();
  const brazilTime = utcToZonedTime(now, timeZone);

  const adjustedDate = new Date(
    Date.UTC(
      brazilTime.getFullYear(),
      brazilTime.getMonth(),
      brazilTime.getDate(),
      brazilTime.getHours(),
      brazilTime.getMinutes(),
      brazilTime.getSeconds(),
      brazilTime.getMilliseconds()
    )
  );

  return adjustedDate;
};

/**
 * Obter hora atual do Brasil para marcar como lida
 *
 * @returns Data/hora atual do Brasil
 */
export const getBrazilReadTime = (): Date => {
  return getBrazilTimeAsUTC();
};

/**
 * Formatar data/hora no padrão brasileiro
 *
 * @param date - Data a ser formatada
 * @param includeTime - Se deve incluir o horário na formatação
 * @returns String formatada no padrão brasileiro
 */
export const formatBrazilTime = (date: Date, includeTime: boolean = true): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.timeZoneName = 'short';
  }

  return new Intl.DateTimeFormat('pt-BR', options).format(date);
};
