import { formatarHora } from './formatar-hora';

// Função para converter data ISO ou outros formatos para dd/mm/yyyy
export const formatarDataParaBR = (
  dateString: string | null | undefined,
  incluirHora: boolean = false,
): string => {
  if (!dateString) {
    return '---------------';
  }

  try {
    // Se já está no formato dd/mm/yyyy (sem hora), retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Se está no formato ISO (yyyy-mm-dd ou yyyy-mm-ddT...)
    if (dateString.includes('-')) {
      const [datePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-');
      const dataFormatada = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;

      // Se incluir hora e tiver o componente de tempo
      if (incluirHora && dateString.includes('T')) {
        const date = new Date(dateString);
        const hora = date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${dataFormatada} - ${hora}`;
      }

      return dataFormatada;
    }

    // Se não conseguir converter, retorna o valor original
    return dateString;
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error);
    return dateString;
  }
};
// ===============

// Função para formatar data e hora do chamado, unindo as duas informações
export function formatarDataHoraChamado(data: string, hora: string): string {
  const dataFormatada = formatarDataParaBR(data);
  const horaFormatada = formatarHora(hora);
  return `${dataFormatada} - ${horaFormatada}`;
}
// ===============
