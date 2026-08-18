import type { Funcionario } from "../types/Funcionario";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

interface NovoFuncionario {
  empresaId: string;
  nome: string;
  usuario: string;
  telefone: string;
  matricula: string;
  senha: string;
  horarioEntrada: string;
  horarioSaida: string;
}

function obterToken(): string | null {
  return localStorage.getItem("nexus-ponto-token");
}

async function requisicao<T>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const token = obterToken();

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

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem ??
        dados?.message ??
        "Erro ao comunicar com o servidor."
    );
  }

  return dados as T;
}

export async function buscarFuncionariosDaEmpresa(
  empresaId: string
): Promise<Funcionario[]> {
  return requisicao<Funcionario[]>(
    `/empresas/${empresaId}/funcionarios`
  );
}

export async function cadastrarFuncionario(
  dados: NovoFuncionario
): Promise<Funcionario> {
  if (!dados.nome.trim()) {
    throw new Error(
      "Digite o nome do funcionário."
    );
  }

  if (!dados.usuario.trim()) {
    throw new Error(
      "Digite o usuário."
    );
  }

  if (!dados.telefone.trim()) {
    throw new Error(
      "Digite o telefone."
    );
  }

  if (!dados.matricula.trim()) {
    throw new Error(
      "Digite a matrícula."
    );
  }

  if (dados.senha.length < 4) {
    throw new Error(
      "A senha deve possuir pelo menos 4 caracteres."
    );
  }

  return requisicao<Funcionario>(
    "/funcionarios",
    {
      method: "POST",
      body: JSON.stringify(dados),
    }
  );
}

export async function atualizarFuncionario(
  funcionario: Funcionario
): Promise<Funcionario> {
  return requisicao<Funcionario>(
    `/funcionarios/${funcionario.id}`,
    {
      method: "PUT",
      body: JSON.stringify(funcionario),
    }
  );
}

export async function excluirFuncionario(
  id: string
): Promise<void> {
  await requisicao<void>(
    `/funcionarios/${id}`,
    {
      method: "DELETE",
    }
  );
}

export async function buscarFuncionario(
  id: string
): Promise<Funcionario> {
  return requisicao<Funcionario>(
    `/funcionarios/${id}`
  );
}

export async function buscarFuncionarioLogado(): Promise<Funcionario> {
  return requisicao<Funcionario>(
    "/auth/me"
  );
}