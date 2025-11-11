// Função para converter data ISO ou outros formatos para dd/mm/yyyy
export const formatarDataParaBR = (
  dateString: string | null | undefined
): string => {
  if (!dateString) {
    return '-';
  }

  try {
    // Se já está no formato dd/mm/yyyy, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Se está no formato ISO (yyyy-mm-dd ou yyyy-mm-ddT...)
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Se não conseguir converter, retorna o valor original
    return dateString;
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error);
    return dateString;
  }
};
// ====================================================================================================