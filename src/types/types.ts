export interface TabelaChamadoProps {
  COD_CHAMADO: number;
  DATA_CHAMADO: string;
  HORA_CHAMADO: string;
  SOLICITACAO_CHAMADO: string | null;
  CONCLUSAO_CHAMADO: string | null;
  STATUS_CHAMADO: string;
  DTENVIO_CHAMADO: string | null;
  COD_RECURSO: number | null;
  CLIENTE_CHAMADO: string | null;
  CODTRF_CHAMADO: number | null;
  COD_CLIENTE: number | null;
  SOLICITACAO2_CHAMADO?: string | null;
  ASSUNTO_CHAMADO: string | null;
  EMAIL_CHAMADO: string | null;
  PRIOR_CHAMADO: number | null;
  COD_CLASSIFICACAO: number | null;
}

// ================================================================================

export interface TabelaOSProps {
  COD_OS: number;
  CODTRF_OS: number;
  DTINI_OS: string;
  HRINI_OS: string;
  HRFIM_OS: string;
  OBS_OS: string | null;
  STATUS_OS: number;
  PRODUTIVO_OS: 'SIM' | 'NAO';
  CODREC_OS: number;
  PRODUTIVO2_OS: 'SIM' | 'NAO';
  RESPCLI_OS: string;
  REMDES_OS: 'SIM' | 'NAO';
  ABONO_OS: 'SIM' | 'NAO';
  DESLOC_OS: string | null;
  OBS: string | null;
  DTINC_OS: string;
  FATURADO_OS: 'SIM' | 'NAO';
  PERC_OS: number;
  COD_FATURAMENTO: number | null;
  COMP_OS: string | null;
  VALID_OS: 'SIM' | 'NAO';
  VRHR_OS: number;
  NUM_OS: string | null;
  CHAMADO_OS: string | null;
  // =====
  COD_RECURSO: number;
  NOME_RECURSO: string;
  // =====
  COD_CLIENTE: number;
  NOME_CLIENTE: string;
  // =====
  NOME_TAREFA: string;
  TAREFA_COMPLETA: string;
  // =====
  COD_PROJETO: number;
  NOME_PROJETO: string;
  PROJETO_COMPLETO: string;
  // =====
  QTD_HR_OS: number | null;
}
// ================================================================================
