export type TipoPonto =
  | "ENTRADA"
  | "INICIO_INTERVALO"
  | "FIM_INTERVALO"
  | "SAIDA";

export type StatusRegistro =
  | "NO_HORARIO"
  | "ATRASADO";

export interface RegistroPonto {
  id: string;

  empresaId: string;
  funcionarioId: string;

  tipo: TipoPonto;
  status: StatusRegistro;

  dataHora: string;

  observacao?: string;

  criadoEm: string;
  atualizadoEm?: string;
}