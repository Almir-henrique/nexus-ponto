export type StatusFuncionario =
  | "PRESENTE"
  | "ATRASADO"
  | "AUSENTE"
  | "NAO_REGISTRADO";

export interface Funcionario {
  id: string;

  empresaId: string;

  nome: string;
  usuario: string;
  telefone: string;
  matricula: string;

  horarioEntrada: string;
  horarioSaida: string;

  status: StatusFuncionario;

  ativo: boolean;

  criadoEm: string;
  atualizadoEm?: string;

  // Registro de ponto do dia
  entradaHoje?: string | null;
  inicioIntervaloHoje?: string | null;
  fimIntervaloHoje?: string | null;
  saidaHoje?: string | null;
}