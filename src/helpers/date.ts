/**
 * Obter hora atual do Brasil convertida para UTC para salvar no banco
 *
 * @returns Data/hora atual do Brasil convertida para UTC
 */
export const getBrazilTimeAsUTC = (): Date => {
  const now = new Date();

  // Converter para horário do Brasil (UTC-3)
  const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  // Retornar como UTC
  return new Date(
    Date.UTC(
      brazilTime.getUTCFullYear(),
      brazilTime.getUTCMonth(),
      brazilTime.getUTCDate(),
      brazilTime.getUTCHours(),
      brazilTime.getUTCMinutes(),
      brazilTime.getUTCSeconds(),
      brazilTime.getUTCMilliseconds()
    )
  );
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
