import type { Empresa } from "../types/Empresa";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

const TOKEN_KEY = "nexus-ponto-token";

interface ErroApi {
  mensagem?: string;
  message?: string;
}

interface AtualizarDadosEmpresa {
  nome: string;
  email: string;
}

interface AtualizarSenhaEmpresa {
  senhaAtual: string;
  novaSenha: string;
}

async function requisicao<T>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const resposta = await fetch(
    `${API_URL}${endpoint}`,
    {
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
    }
  );

  const dados = (await resposta
    .json()
    .catch(() => null)) as
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
}

export async function atualizarDadosEmpresa(
  empresaId: string,
  dados: AtualizarDadosEmpresa
): Promise<Empresa> {
  const nome = dados.nome.trim();

  const email = dados.email
    .trim()
    .toLowerCase();

  if (!nome) {
    throw new Error(
      "Digite o nome da empresa."
    );
  }

  if (!email) {
    throw new Error(
      "Digite o e-mail da empresa."
    );
  }

  return requisicao<Empresa>(
    `/empresas/${empresaId}/dados`,
    {
      method: "PATCH",
      body: JSON.stringify({
        nome,
        email,
      }),
    }
  );
}

export async function atualizarCodigoEmpresa(
  empresaId: string,
  codigo: string
): Promise<Empresa> {
  const codigoLimpo = codigo
    .trim()
    .toUpperCase();

  if (!codigoLimpo) {
    throw new Error(
      "Digite o código da empresa."
    );
  }

  if (
    !/^[A-Z0-9_-]{4,30}$/.test(
      codigoLimpo
    )
  ) {
    throw new Error(
      "O código deve ter entre 4 e 30 caracteres e usar apenas letras, números, hífen ou sublinhado."
    );
  }

  return requisicao<Empresa>(
    `/empresas/${empresaId}/codigo`,
    {
      method: "PATCH",
      body: JSON.stringify({
        codigo: codigoLimpo,
      }),
    }
  );
}

export async function atualizarSenhaEmpresa(
  empresaId: string,
  dados: AtualizarSenhaEmpresa
): Promise<void> {
  if (!dados.senhaAtual.trim()) {
    throw new Error(
      "Digite a senha atual."
    );
  }

  if (dados.novaSenha.length < 4) {
    throw new Error(
      "A nova senha deve possuir pelo menos 4 caracteres."
    );
  }

  await requisicao<void>(
    `/empresas/${empresaId}/senha`,
    {
      method: "PATCH",
      body: JSON.stringify({
        senhaAtual: dados.senhaAtual,
        novaSenha: dados.novaSenha,
      }),
    }
  );
}