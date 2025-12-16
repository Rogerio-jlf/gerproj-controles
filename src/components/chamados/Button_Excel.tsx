'use client';

import { formatarDataParaBR } from '@/formatters/formatar-data';
import {
  formatarHora,
  formatarHorasTotaisSufixo,
} from '@/formatters/formatar-hora';
import { formatarNumeros } from '@/formatters/formatar-numeros';
import { corrigirTextoCorrompido } from '@/formatters/formatar-texto-corrompido';
import { renderizarDoisPrimeirosNomes } from '@/formatters/remover-acentuacao';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useState } from 'react';
import { RiFileExcel2Fill } from 'react-icons/ri';
import type { ChamadoRowProps } from './Colunas_Tabela_Chamados';
import type { OSRowProps } from './Colunas_Tabela_OS';

// ================================================================================
// INTERFACES
// ================================================================================

interface FiltrosRelatorio {
  ano: string;
  mes: string;
  cliente?: string;
  recurso?: string;
  status?: string;
  totalChamados?: number;
  totalOS?: number;
  totalHorasOS?: number;
}

interface ExportaExcelChamadosButtonProps {
  data: ChamadoRowProps[];
  filtros?: FiltrosRelatorio;
  isAdmin: boolean;
  codCliente?: string | null;
  filename?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

// ================================================================================
// FUNÇÕES AUXILIARES
// ================================================================================
function getColumnLetter(index: number): string {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// Buscar OS's de um chamado específico
async function fetchOSByChamado(
  codChamado: number,
  isAdmin: boolean,
  codCliente?: string | null,
): Promise<OSRowProps[]> {
  try {
    const params = new URLSearchParams({
      isAdmin: String(isAdmin),
    });

    if (!isAdmin && codCliente) {
      params.append('codCliente', codCliente);
    }

    const response = await fetch(
      `/api/chamados/${codChamado}/os?${params.toString()}`,
    );

    if (!response.ok) {
      console.error(`Erro ao buscar OS's do chamado ${codChamado}`);
      return [];
    }

    const data = await response.json();
    return data.success && data.data ? data.data : [];
  } catch (error) {
    console.error(`Erro ao buscar OS's do chamado ${codChamado}:`, error);
    return [];
  }
}

// Buscar OS's de múltiplos chamados
async function fetchAllOS(
  chamados: ChamadoRowProps[],
  isAdmin: boolean,
  codCliente?: string | null,
  onProgress?: (current: number, total: number) => void,
): Promise<Map<number, OSRowProps[]>> {
  const osMap = new Map<number, OSRowProps[]>();

  // Filtrar apenas chamados que têm OS
  const chamadosComOS = chamados.filter((c) => c.TEM_OS);

  if (chamadosComOS.length === 0) {
    return osMap;
  }

  console.log(`[EXCEL] Buscando OS's de ${chamadosComOS.length} chamados...`);

  // Buscar OS's em lotes de 5 para não sobrecarregar
  const BATCH_SIZE = 5;

  for (let i = 0; i < chamadosComOS.length; i += BATCH_SIZE) {
    const batch = chamadosComOS.slice(i, i + BATCH_SIZE);

    // Atualizar progresso
    if (onProgress) {
      onProgress(i, chamadosComOS.length);
    }

    // Buscar OS's do lote em paralelo
    const promises = batch.map((chamado) =>
      fetchOSByChamado(chamado.COD_CHAMADO, isAdmin, codCliente).then(
        (osList) => ({
          codChamado: chamado.COD_CHAMADO,
          osList,
        }),
      ),
    );

    const results = await Promise.all(promises);

    // Adicionar ao Map
    results.forEach(({ codChamado, osList }) => {
      if (osList.length > 0) {
        osMap.set(codChamado, osList);
      }
    });
  }

  // Atualizar progresso final
  if (onProgress) {
    onProgress(chamadosComOS.length, chamadosComOS.length);
  }

  console.log(`[EXCEL] ✅ ${osMap.size} chamados com OS's carregadas`);
  return osMap;
}

// ================================================================================
// COMPONENTE DE LOADING SPINNER
// ================================================================================
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// ================================================================================
// COMPONENTE
// ================================================================================
export function ExportaExcelChamadosButton({
  data,
  filtros,
  isAdmin,
  codCliente,
  className = '',
  disabled = false,
}: ExportaExcelChamadosButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Validação: se não há dados, desabilita o botão
  if (!data || data.length === 0) {
    disabled = true;
  }

  const exportToExcel = async () => {
    setIsExporting(true);
    setProgress({ current: 0, total: 0 });

    try {
      // 1. Buscar todas as OS's primeiro
      console.log("[EXCEL] Iniciando busca de OS's...");
      const osData = await fetchAllOS(
        data,
        isAdmin,
        codCliente,
        (current, total) => {
          setProgress({ current, total });
        },
      );

      console.log('[EXCEL] Gerando planilha Excel...');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório Chamados');
      worksheet.views = [{ showGridLines: false }];

      let currentRow = 1;

      // ================================================================================
      // CABEÇALHO DO RELATÓRIO
      // ================================================================================
      const numColunas = 11;
      const ultimaColuna = getColumnLetter(numColunas - 1);

      worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = 'RELATÓRIO DE CHAMADOS E ORDENS DE SERVIÇO';
      titleCell.font = { bold: true, size: 22, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B21A8' },
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      // Data de geração
      worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
      const dateCell = worksheet.getCell(`A${currentRow}`);
      dateCell.value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      dateCell.font = {
        italic: true,
        size: 16,
        color: { argb: 'FFFFFFFF' },
      };
      dateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B21A8' },
      };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      currentRow += 1;

      // ================================================================================
      // FILTROS APLICADOS
      // ================================================================================
      if (filtros && Object.keys(filtros).length > 0) {
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const filtrosTitleCell = worksheet.getCell(`A${currentRow}`);
        filtrosTitleCell.value = 'FILTROS APLICADOS';
        filtrosTitleCell.font = {
          bold: true,
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        filtrosTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '000000' },
        };
        filtrosTitleCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(currentRow).height = 24;
        filtrosTitleCell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        currentRow++;

        const setBorder = (cell: any) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        };

        // Período Mês/Ano
        if (filtros.mes && filtros.ano) {
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
          const labelCell = worksheet.getCell(`A${currentRow}`);
          labelCell.value = 'Período:';
          labelCell.font = { bold: true };
          labelCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(labelCell);

          const mesNome = [
            '',
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
          ][parseInt(filtros.mes)];

          const valueCell = worksheet.getCell(`C${currentRow}`);
          valueCell.value = `${mesNome}/${filtros.ano}`;
          valueCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(valueCell);
          worksheet.getRow(currentRow).height = 24;
          currentRow++;
        }

        // Filtro Cliente
        if (filtros.cliente) {
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
          const labelCell = worksheet.getCell(`A${currentRow}`);
          labelCell.value = 'Cliente:';
          labelCell.font = { bold: true };
          labelCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(labelCell);

          const valueCell = worksheet.getCell(`C${currentRow}`);
          valueCell.value = filtros.cliente;
          valueCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(valueCell);
          worksheet.getRow(currentRow).height = 24;
          currentRow++;
        }

        // Filtro Recurso
        if (filtros.recurso) {
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
          const labelCell = worksheet.getCell(`A${currentRow}`);
          labelCell.value = 'Recurso:';
          labelCell.font = { bold: true };
          labelCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(labelCell);

          const valueCell = worksheet.getCell(`C${currentRow}`);
          valueCell.value = filtros.recurso;
          valueCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(valueCell);
          worksheet.getRow(currentRow).height = 24;
          currentRow++;
        }

        // Filtro Status
        if (filtros.status) {
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
          const labelCell = worksheet.getCell(`A${currentRow}`);
          labelCell.value = 'Status:';
          labelCell.font = { bold: true };
          labelCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(labelCell);

          const valueCell = worksheet.getCell(`C${currentRow}`);
          valueCell.value = filtros.status;
          valueCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          setBorder(valueCell);
          worksheet.getRow(currentRow).height = 24;
          currentRow++;
        }

        currentRow += 1;
      }

      // ================================================================================
      // TOTALIZADORES
      // ================================================================================
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const totTitleCell = worksheet.getCell(`A${currentRow}`);
      totTitleCell.value = 'TOTALIZADORES';
      totTitleCell.font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFFFF' },
      };
      totTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '000000' },
      };
      totTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 24;
      currentRow++;

      const totalChamados = filtros?.totalChamados ?? data.length;
      const totalOS = filtros?.totalOS ?? 0;
      const totalHorasOS = filtros?.totalHorasOS ?? 0;

      const totHeaders = [
        'Total de Chamados',
        "Total de OS's",
        'Total de Horas',
      ];
      const totValues = [
        totalChamados,
        totalOS,
        formatarHorasTotaisSufixo(totalHorasOS),
      ];
      const totColors = ['6B21A8', '0891B2', '059669'];

      for (let i = 0; i < totHeaders.length; i++) {
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const headerCell = worksheet.getCell(`A${currentRow}`);
        headerCell.value = totHeaders[i];
        headerCell.font = {
          bold: true,
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: totColors[i] },
        };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        headerCell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };

        worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
        const valueCell = worksheet.getCell(`C${currentRow}`);
        valueCell.value = totValues[i];
        valueCell.font = { size: 12 };
        valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        valueCell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (i < 2) {
          valueCell.numFmt = '#,##0';
        }
        worksheet.getRow(currentRow).height = 24;
        currentRow++;
      }

      currentRow++;

      // ================================================================================
      // SEÇÃO: CHAMADOS
      // ================================================================================
      worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
      const chamadosSectionCell = worksheet.getCell(`A${currentRow}`);
      chamadosSectionCell.value = "CHAMADOS SEM OS's";
      chamadosSectionCell.font = {
        bold: true,
        size: 14,
        color: { argb: 'FFFFFFFF' },
      };
      chamadosSectionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B21A8' },
      };
      chamadosSectionCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      worksheet.getRow(currentRow).height = 28;
      currentRow++;

      // Cabeçalhos dos Chamados
      const headersChamados = [
        'CHAMADO',
        'DATA',
        'PRIORIDADE',
        'ASSUNTO',
        'EMAIL',
        'CLASSIFICAÇÃO',
        'DATA/HORA ATRIBUIÇÃO',
        'CONSULTOR',
        'STATUS',
        'CONCLUSÃO',
        'HORAS TOTAIS',
      ];

      headersChamados.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F766E' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(currentRow).height = 24;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
      currentRow++;

      // Dados dos Chamados + suas OS's
      // ================================================================================
      // SEPARAR CHAMADOS: SEM OS e COM OS
      // ================================================================================
      const chamadosSemOS = data.filter((c) => !c.TEM_OS);
      const chamadosComOS = data.filter((c) => c.TEM_OS);

      // ================================================================================
      // RENDERIZAR FUNÇÃO AUXILIAR PARA CHAMADO
      // ================================================================================
      const renderizarChamado = (chamado: ChamadoRowProps) => {
        const rowData = [
          formatarNumeros(chamado.COD_CHAMADO) || 'n/a',
          formatarDataParaBR(chamado.DATA_CHAMADO) || null,
          chamado.PRIOR_CHAMADO || 'n/a',
          corrigirTextoCorrompido(chamado.ASSUNTO_CHAMADO) || 'n/a',
          chamado.EMAIL_CHAMADO || 'n/a',
          corrigirTextoCorrompido(chamado.NOME_CLASSIFICACAO) || 'n/a',
          formatarDataParaBR(chamado.DTENVIO_CHAMADO) || null,
          renderizarDoisPrimeirosNomes(
            corrigirTextoCorrompido(chamado.NOME_RECURSO),
          ) || 'n/a',
          chamado.STATUS_CHAMADO || 'n/a',
          chamado.CONCLUSAO_CHAMADO || 'n/a',
          formatarHorasTotaisSufixo(chamado.TOTAL_HORAS_OS) || '0h',
        ];

        rowData.forEach((value, colIndex) => {
          const cell = worksheet.getCell(currentRow, colIndex + 1);
          cell.value = value;

          const colunasCentralizadas = [0, 1, 2, 6, 9, 10];
          const colunasComIndentacao = [3, 4, 5, 7, 8];

          cell.alignment = {
            horizontal: colunasCentralizadas.includes(colIndex)
              ? 'center'
              : 'left',
            vertical: 'middle',
            indent: colunasComIndentacao.includes(colIndex) ? 2 : 0,
            wrapText: colIndex === 3,
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };

          if (colIndex === 0) {
            cell.font = { bold: true, color: { argb: 'FF6B21A8' } };
          }
        });

        worksheet.getRow(currentRow).height = 24;
        currentRow++;
      };

      // ================================================================================
      // 1️⃣ CHAMADOS SEM OS (AGRUPADOS)
      // ================================================================================
      if (chamadosSemOS.length > 0) {
        chamadosSemOS.forEach((chamado) => {
          renderizarChamado(chamado);
        });

        // Linha separadora GROSSA entre Chamados sem OS e Chamados com OS
        currentRow++;
        worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
        const separatorCell = worksheet.getCell(`A${currentRow}`);
        separatorCell.value = '';
        separatorCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF000000' },
        };
        separatorCell.border = {
          top: { style: 'thick', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
        };
        worksheet.getRow(currentRow).height = 5;
        currentRow++;

        // Linha em branco
        currentRow++;
      }

      // ================================================================================
      // 2️⃣ CHAMADOS COM OS (INDIVIDUAIS COM SUAS OS's)
      // ================================================================================
      if (chamadosComOS.length > 0) {
        // Título da seção CHAMADOS COM OS's
        worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
        const comOsTitleCell = worksheet.getCell(`A${currentRow}`);
        comOsTitleCell.value = "CHAMADOS COM OS's";
        comOsTitleCell.font = {
          bold: true,
          size: 14,
          color: { argb: 'FFFFFFFF' },
        };
        comOsTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6B21A8' },
        };
        comOsTitleCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(currentRow).height = 28;
        currentRow++;

        // Linha em branco
        currentRow++;
      }

      chamadosComOS.forEach((chamado, index) => {
        // Definir cor de fundo alternada (zebrado)
        const isEven = index % 2 === 0;
        const bgColor = isEven ? 'FFF9FAFB' : 'FFFFFFFF'; // Cinza claro / Branco
        const startRowChamado = currentRow;

        // Título do chamado (apenas para chamados com OS)
        worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
        const chamadoTitleCell = worksheet.getCell(`A${currentRow}`);
        chamadoTitleCell.value = `CHAMADO #${chamado.COD_CHAMADO}`;
        chamadoTitleCell.font = {
          bold: true,
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        chamadoTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6B21A8' },
        };
        chamadoTitleCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(currentRow).height = 26;
        currentRow++;

        // Cabeçalhos do chamado
        const headersChamados = [
          'CHAMADO',
          'DATA',
          'PRIORIDADE',
          'ASSUNTO',
          'EMAIL',
          'CLASSIFICAÇÃO',
          'DATA ENVIO',
          'RECURSO',
          'STATUS',
          'CONCLUSÃO',
          'HORAS TOTAIS',
        ];

        headersChamados.forEach((header, colIndex) => {
          const cell = worksheet.getCell(currentRow, colIndex + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F766E' },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          worksheet.getRow(currentRow).height = 20;
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
        currentRow++;

        // Salvar a linha do chamado para aplicar fundo depois
        const rowChamadoData = currentRow;

        // Dados do chamado
        renderizarChamado(chamado);

        // Aplicar fundo alternado na linha de dados do chamado
        for (let col = 1; col <= numColunas; col++) {
          const cell = worksheet.getCell(rowChamadoData, col);
          const currentFill = cell.fill;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor },
          };
        }

        // ⭐ OS's DESTE CHAMADO
        const osList = osData.get(chamado.COD_CHAMADO);
        if (osList && osList.length > 0) {
          currentRow++;
          // Mesclar apenas até a coluna H (8 colunas) ao invés de todas
          worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
          const osTitleCell = worksheet.getCell(`A${currentRow}`);
          osTitleCell.value = 'ORDENS DE SERVIÇO';
          osTitleCell.font = {
            bold: true,
            size: 11,
            color: { argb: 'FFFFFFFF' },
          };
          osTitleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0891B2' },
          };
          osTitleCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          worksheet.getRow(currentRow).height = 22;
          currentRow++;

          const headersOS = [
            'OS',
            'DATA',
            'HR. INÍCIO',
            'HR. FIM',
            'HORAS',
            'CONSULTOR',
            'ENTREGÁVEL',
            'VALIDAÇÃO',
          ];

          headersOS.forEach((header, index) => {
            const cell = worksheet.getCell(currentRow, index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF14B8A6' },
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(currentRow).height = 20;
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            };
          });
          currentRow++;

          osList.forEach((os) => {
            const osRowData = [
              formatarNumeros(os.COD_OS) || 'n/a',
              formatarDataParaBR(os.DTINI_OS) || null,
              formatarHora(os.HRINI_OS) || null,
              formatarHora(os.HRFIM_OS) || null,
              formatarHorasTotaisSufixo(os.TOTAL_HORAS_OS) || 'n/a',
              renderizarDoisPrimeirosNomes(
                corrigirTextoCorrompido(os.NOME_RECURSO),
              ) || 'n/a',
              corrigirTextoCorrompido(os.NOME_TAREFA) || 'n/a',
              os.VALCLI_OS || 'n/a',
            ];

            osRowData.forEach((value, colIndex) => {
              const cell = worksheet.getCell(currentRow, colIndex + 1);
              cell.value = value;

              const colunasCentralizadas = [0, 1, 2, 3, 4, 7];

              cell.alignment = {
                horizontal: colunasCentralizadas.includes(colIndex)
                  ? 'center'
                  : 'left',
                vertical: 'middle',
                indent: colIndex === 5 || colIndex === 6 ? 2 : 0,
                wrapText: colIndex === 6,
              };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              };

              if (colIndex === 7) {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {
                    argb:
                      value === 'SIM' || value === 'Sim'
                        ? 'FF3B82F6'
                        : 'FFEF4444',
                  },
                };
              } else {
                // Aplicar fundo alternado nas células de OS
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: bgColor },
                };
              }

              if (colIndex === 0 && typeof value === 'number') {
                cell.numFmt = '#,##0';
              }
            });

            worksheet.getRow(currentRow).height = 20;
            currentRow++;
          });
        }

        // Espaçamento entre chamados com linha separadora
        if (index < chamadosComOS.length - 1) {
          currentRow++;

          // Linha separadora preta MAIS grossa e mais alta
          worksheet.mergeCells(`A${currentRow}:${ultimaColuna}${currentRow}`);
          const separatorCell = worksheet.getCell(`A${currentRow}`);
          separatorCell.value = '';
          separatorCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' },
          };
          separatorCell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
          };
          worksheet.getRow(currentRow).height = 10; // Aumentado de 6 para 10

          currentRow++;

          // Linha em branco adicional após o separador
          currentRow++;
        }
      });

      // ================================================================================
      // CONFIGURAÇÕES FINAIS
      // ================================================================================
      const columnWidths = [
        { width: 12 },
        { width: 15 },
        { width: 12 },
        { width: 35 },
        { width: 30 },
        { width: 25 },
        { width: 15 },
        { width: 20 },
        { width: 30 },
        { width: 15 },
        { width: 15 },
      ];

      worksheet.columns = columnWidths;

      // ================================================================================
      // SALVAR ARQUIVO
      // ================================================================================
      console.log('[EXCEL] Salvando arquivo...');
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const timestamp = new Date().getTime();
      const nomeArquivo = `Relatorio_Chamados_${filtros?.mes || 'todos'}_${filtros?.ano || new Date().getFullYear()}_${timestamp}.xlsx`;
      saveAs(blob, nomeArquivo);

      console.log('[EXCEL] ✅ Excel gerado com sucesso!');
    } catch (error) {
      console.error('[EXCEL] ❌ Erro ao exportar Excel:', error);
      alert('Erro ao gerar o Excel. Tente novamente.');
    } finally {
      setIsExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // ================================================================================
  // RENDERIZAÇÃO
  // ================================================================================
  return (
    <button
      onClick={exportToExcel}
      disabled={isExporting || disabled}
      title={
        disabled
          ? 'Não há dados para exportar'
          : isExporting
            ? progress.total > 0
              ? `Buscando OS's: ${progress.current}/${progress.total}`
              : 'Gerando Excel...'
            : 'Exportar para Excel'
      }
      className={`group cursor-pointer rounded-md bg-gradient-to-br from-green-600 to-green-700 p-3 shadow-md shadow-black hover:shadow-xl hover:shadow-black transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    >
      {isExporting ? (
        <div className="flex flex-col items-center gap-1">
          <LoadingSpinner />
          {progress.total > 0 && (
            <span className="text-xs text-white font-bold">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      ) : (
        <RiFileExcel2Fill
          className="text-white group-hover:scale-110"
          size={24}
        />
      )}
    </button>
  );
}
