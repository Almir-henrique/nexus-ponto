import type {
  Justificativa,
  StatusJustificativa,
  TipoJustificativa,
} from "../types/Justificativa";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

const TOKEN_KEY =
  "nexus-ponto-token";

interface ErroApi {
  mensagem?: string;
  message?: string;
}

interface NovaJustificativa {
  tipo: TipoJustificativa;
  dataOcorrencia: string;
  descricao: string;
  anexo?: File | null;
}

interface AnaliseJustificativa {
  status: Exclude<
    StatusJustificativa,
    "PENDENTE"
  >;

  observacaoEmpresa?: string;
}

async function requisicao<T>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const token =
    localStorage.getItem(
      TOKEN_KEY
    );

  const usandoFormData =
    opcoes.body instanceof FormData;

  const headers =
    new Headers(
      opcoes.headers
    );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  if (!usandoFormData) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const resposta =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...opcoes,
        headers,
      }
    );

  const dados =
    (await resposta
      .json()
      .catch(() => null)) as
      | T
      | ErroApi
      | null;

  if (!resposta.ok) {
    const erro =
      dados as ErroApi | null;

    throw new Error(
      erro?.mensagem ??
        erro?.message ??
        "Não foi possível concluir a operação."
    );
  }

  return dados as T;
}

export async function enviarJustificativa(
  dados: NovaJustificativa
): Promise<Justificativa> {
  const formulario =
    new FormData();

  formulario.append(
    "tipo",
    dados.tipo
  );

  formulario.append(
    "dataOcorrencia",
    dados.dataOcorrencia
  );

  formulario.append(
    "descricao",
    dados.descricao
  );

  if (dados.anexo) {
    formulario.append(
      "anexo",
      dados.anexo
    );
  }

  return requisicao<Justificativa>(
    "/justificativas",
    {
      method: "POST",
      body: formulario,
    }
  );
}

export async function buscarJustificativasFuncionario(
  funcionarioId: string
): Promise<Justificativa[]> {
  return requisicao<
    Justificativa[]
  >(
    `/justificativas/funcionarios/${funcionarioId}`
  );
}

export async function buscarJustificativasEmpresa(
  empresaId: string
): Promise<Justificativa[]> {
  return requisicao<
    Justificativa[]
  >(
    `/justificativas/empresas/${empresaId}`
  );
}

export async function analisarJustificativa(
  justificativaId: string,
  dados: AnaliseJustificativa
): Promise<Justificativa> {
  return requisicao<Justificativa>(
    `/justificativas/${justificativaId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(
        dados
      ),
    }
  );
}