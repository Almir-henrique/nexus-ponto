import type { Empresa } from "../types/Empresa";
import type { Funcionario } from "../types/Funcionario";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

const TOKEN_KEY = "nexus-ponto-token";
const PERFIL_KEY = "nexus-ponto-perfil-logado";
const USUARIO_KEY = "nexus-ponto-usuario-logado";

export type PerfilUsuario =
  | "EMPRESA"
  | "FUNCIONARIO";

interface CadastroEmpresaDados {
  nome: string;
  email: string;
  senha: string;
}

interface LoginEmpresaDados {
  email: string;
  senha: string;
}

interface LoginFuncionarioDados {
  codigoEmpresa: string;
  matricula: string;
  senha: string;
}

interface RespostaAutenticacao<T> {
  token: string;
  usuario: T;
}

interface ErroApi {
  mensagem?: string;
  message?: string;
}

async function requisicao<T>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  try {
    const token = localStorage.getItem(
      TOKEN_KEY
    );

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
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao servidor."
      );
    }

    throw error;
  }
}

export async function cadastrarEmpresa(
  dados: CadastroEmpresaDados
): Promise<RespostaAutenticacao<Empresa>> {
  const nome = dados.nome.trim();

  const email = dados.email
    .trim()
    .toLowerCase();

  const senha = dados.senha;

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

  if (senha.length < 4) {
    throw new Error(
      "A senha deve possuir pelo menos 4 caracteres."
    );
  }

  return requisicao<
    RespostaAutenticacao<Empresa>
  >("/auth/empresa/cadastro", {
    method: "POST",
    body: JSON.stringify({
      nome,
      email,
      senha,
    }),
  });
}

export async function loginEmpresa(
  dados: LoginEmpresaDados
): Promise<RespostaAutenticacao<Empresa>> {
  const email = dados.email
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error(
      "Digite o e-mail da empresa."
    );
  }

  if (!dados.senha) {
    throw new Error(
      "Digite sua senha."
    );
  }

  return requisicao<
    RespostaAutenticacao<Empresa>
  >("/auth/empresa/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      senha: dados.senha,
    }),
  });
}

export async function loginFuncionario(
  dados: LoginFuncionarioDados
): Promise<
  RespostaAutenticacao<Funcionario>
> {
  const codigoEmpresa =
    dados.codigoEmpresa
      .trim()
      .toUpperCase();

  const matricula =
    dados.matricula.trim();

  if (!codigoEmpresa) {
    throw new Error(
      "Digite o código da empresa."
    );
  }

  if (!matricula) {
    throw new Error(
      "Digite sua matrícula."
    );
  }

  if (!dados.senha) {
    throw new Error(
      "Digite sua senha."
    );
  }

  return requisicao<
    RespostaAutenticacao<Funcionario>
  >("/auth/funcionario/login", {
    method: "POST",
    body: JSON.stringify({
      codigoEmpresa,
      matricula,
      senha: dados.senha,
    }),
  });
}

export async function buscarUsuarioAtual():
  Promise<Empresa | Funcionario> {
  return requisicao<
    Empresa | Funcionario
  >("/auth/me");
}

export function salvarSessao(
  token: string,
  perfil: PerfilUsuario,
  usuario: Empresa | Funcionario
): void {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    PERFIL_KEY,
    perfil
  );

  localStorage.setItem(
    USUARIO_KEY,
    JSON.stringify(usuario)
  );
}

export function buscarToken():
  | string
  | null {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

export function buscarPerfilLogado():
  | PerfilUsuario
  | null {
  const perfil =
    localStorage.getItem(PERFIL_KEY);

  if (
    perfil !== "EMPRESA" &&
    perfil !== "FUNCIONARIO"
  ) {
    return null;
  }

  return perfil;
}

export function buscarEmpresaLogada():
  | Empresa
  | null {
  if (
    buscarPerfilLogado() !== "EMPRESA"
  ) {
    return null;
  }

  try {
    const dados =
      localStorage.getItem(USUARIO_KEY);

    if (!dados) {
      return null;
    }

    return JSON.parse(
      dados
    ) as Empresa;
  } catch {
    return null;
  }
}

export function buscarFuncionarioLogado():
  | Funcionario
  | null {
  if (
    buscarPerfilLogado() !==
    "FUNCIONARIO"
  ) {
    return null;
  }

  try {
    const dados =
      localStorage.getItem(USUARIO_KEY);

    if (!dados) {
      return null;
    }

    return JSON.parse(
      dados
    ) as Funcionario;
  } catch {
    return null;
  }
}

export function estaAutenticado():
  boolean {
  return Boolean(
    buscarToken() &&
      buscarPerfilLogado() &&
      localStorage.getItem(
        USUARIO_KEY
      )
  );
}

export function logout(): void {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    PERFIL_KEY
  );

  localStorage.removeItem(
    USUARIO_KEY
  );

  localStorage.removeItem(
    "nexus-ponto-empresa-logada"
  );

  localStorage.removeItem(
    "nexus-ponto-funcionario-logado"
  );
}

export function logoutEmpresa(): void {
  logout();
}

export function logoutFuncionario(): void {
  logout();
}