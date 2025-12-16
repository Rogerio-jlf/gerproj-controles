// Formata números no padrão "1.234.567"
export const formatarNumeros = (
  value: string | number | null | undefined,
): string => {
  if (!value && value !== 0) return '';

  // Garante conversão para string
  const stringValue = String(value);

  const onlyDigits = stringValue.replace(/\D/g, '');
  if (!onlyDigits) return '';

  return new Intl.NumberFormat('de-DE').format(Number(onlyDigits));
};
// ====================================================================================================

// Formata a prioridade no formato "P-{número}"
export const formatarPrioridade = (prioridade: number): string => {
  return `P-${prioridade}`;
};
// ====================================================================================================
