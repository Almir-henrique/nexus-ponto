export type TipoJustificativa =
  | "ATRASO"
  | "FALTA"
  | "ESQUECI_PONTO"
  | "SAIDA_ANTECIPADA"
  | "OUTRO";

export type StatusJustificativa =
  | "PENDENTE"
  | "APROVADA"
  | "RECUSADA";

export interface Justificativa {
  id: string;

  empresaId: string;
  funcionarioId: string;

  tipo: TipoJustificativa;

  dataOcorrencia: string;

  descricao: string;

  status: StatusJustificativa;

  observacaoEmpresa?: string | null;

  analisadaEm?: string | null;

  criadaEm: string;
  atualizadaEm: string;

  funcionarioNome?: string;
  funcionarioMatricula?: string;

  // ===== Anexo =====

  anexoNome?: string | null;

  anexoUrl?: string | null;

  anexoTipo?: string | null;

  anexoTamanho?: number | null;
}