import type {
  RegistroPonto,
  StatusRegistro,
  TipoPonto,
} from "../types/RegistroPonto";

import { buscarToken } from "./authService";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

interface NovoRegistroPonto {
  empresaId: string;
  funcionarioId: string;
  tipo: TipoPonto;
  status: StatusRegistro;
}

interface ErroApi {
  mensagem?: string;
  message?: string;
}

async function requisicao<T>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const token = buscarToken();

  try {
    const resposta = await fetch(`${API_URL}${endpoint}`, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...opcoes.headers,
      },
    });

    const dados = (await resposta.json().catch(() => null)) as
      | T
      | ErroApi
      | null;

    if (!resposta.ok) {
      const erro = dados as ErroApi | null;

      throw new Error(
        erro?.mensagem ??
          erro?.message ??
          "Não foi possível concluir a operação."
      );
    }

    return dados as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao servidor."
      );
    }

    throw error;
  }
}

export async function buscarRegistrosDoFuncionario(
  funcionarioId: string
): Promise<RegistroPonto[]> {
  if (!funcionarioId.trim()) {
    throw new Error(
      "Funcionário não informado."
    );
  }

  return requisicao<RegistroPonto[]>(
    `/funcionarios/${encodeURIComponent(
      funcionarioId
    )}/registros-ponto`
  );
}

export async function buscarRegistrosDoFuncionarioPorData(
  funcionarioId: string,
  data: string
): Promise<RegistroPonto[]> {
  if (!funcionarioId.trim()) {
    throw new Error(
      "Funcionário não informado."
    );
  }

  if (!data.trim()) {
    throw new Error(
      "Data não informada."
    );
  }

  const parametros = new URLSearchParams({
    data: data.trim(),
  });

  return requisicao<RegistroPonto[]>(
    `/funcionarios/${encodeURIComponent(
      funcionarioId
    )}/registros-ponto?${parametros.toString()}`
  );
}

export async function cadastrarRegistroPonto(
  dados: NovoRegistroPonto
): Promise<RegistroPonto> {
  if (!dados.empresaId.trim()) {
    throw new Error(
      "Empresa não informada."
    );
  }

  if (!dados.funcionarioId.trim()) {
    throw new Error(
      "Funcionário não informado."
    );
  }

  return requisicao<RegistroPonto>(
    "/registros-ponto",
    {
      method: "POST",

      body: JSON.stringify({
        empresaId: dados.empresaId,
        funcionarioId: dados.funcionarioId,
        tipo: dados.tipo,
        status: dados.status,
      }),
    }
  );
}

export async function excluirRegistroPonto(
  registroId: string
): Promise<void> {
  if (!registroId.trim()) {
    throw new Error(
      "Registro de ponto não informado."
    );
  }

  await requisicao<void>(
    `/registros-ponto/${encodeURIComponent(
      registroId
    )}`,
    {
      method: "DELETE",
    }
  );
}