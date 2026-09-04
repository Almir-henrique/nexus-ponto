import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { pool } from "../config/database";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";

interface EmpresaBanco {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  senha_hash: string;
  ativa: boolean;
  criada_em: Date;
  atualizada_em: Date;
}

interface FuncionarioBanco {
  id: string;
  empresa_id: string;
  nome: string;
  usuario: string;
  telefone: string;
  matricula: string;
  senha_hash: string;
  horario_entrada: string;
  horario_saida: string;
  status: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

// Fixed dummy hash to normalize execution timing when user is not found
const DUMMY_HASH = "$2b$12$e868d4yJbC.u6v1Pq7K2eO7X1a2b3c4d5e6f7g8h9i0j1k2l3m4n5";

function gerarToken(
  id: string,
  perfil: "EMPRESA" | "FUNCIONARIO",
  empresaId: string
): string {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error("JWT_SECRET não configurado.");
  }

  return jwt.sign(
    {
      id,
      perfil,
      empresaId,
    },
    segredo,
    {
      algorithm: "HS256",
      expiresIn: "2h",
      issuer: "nexus-ponto-api",
      audience: "nexus-ponto-web",
    }
  );
}

function gerarCodigoEmpresa(): string {
  const codigo = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `EMP${codigo}`;
}

function formatarEmpresa(empresa: EmpresaBanco) {
  return {
    id: empresa.id,
    codigo: empresa.codigo,
    nome: empresa.nome,
    email: empresa.email,
    ativa: empresa.ativa,
    criadaEm: empresa.criada_em,
    atualizadaEm: empresa.atualizada_em,
  };
}

function formatarFuncionario(funcionario: FuncionarioBanco) {
  return {
    id: funcionario.id,
    empresaId: funcionario.empresa_id,
    nome: funcionario.nome,
    usuario: funcionario.usuario,
    telefone: funcionario.telefone,
    matricula: funcionario.matricula,
    horarioEntrada: funcionario.horario_entrada,
    horarioSaida: funcionario.horario_saida,
    status: funcionario.status,
    ativo: funcionario.ativo,
    criadoEm: funcionario.criado_em,
    atualizadoEm: funcionario.atualizado_em,
  };
}

export async function cadastrarEmpresa(req: Request, res: Response) {
  const { nome, email, senha } = req.body;

  if (
    typeof nome !== "string" ||
    typeof email !== "string" ||
    typeof senha !== "string"
  ) {
    return res.status(400).json({
      mensagem: "Nome, e-mail e senha são obrigatórios.",
    });
  }

  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim().toLowerCase();

  if (!nomeLimpo || !emailLimpo) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos.",
    });
  }

  if (senha.length < 8) {
    return res.status(400).json({
      mensagem: "A senha deve possuir pelo menos 8 caracteres.",
    });
  }

  try {
    const empresaExistente = await pool.query(
      `
        SELECT id
        FROM empresas
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [emailLimpo]
    );

    if (empresaExistente.rowCount) {
      return res.status(409).json({
        mensagem: "Já existe uma empresa cadastrada com esse e-mail.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    let empresa: EmpresaBanco | null = null;
    let tentativas = 0;

    // Retry loop handling unique constraint collisions concurrently
    while (!empresa && tentativas < 5) {
      tentativas++;
      const codigo = gerarCodigoEmpresa();

      try {
        const resultado = await pool.query<EmpresaBanco>(
          `
            INSERT INTO empresas (
              codigo,
              nome,
              email,
              senha_hash
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
              id,
              codigo,
              nome,
              email,
              senha_hash,
              ativa,
              criada_em,
              atualizada_em
          `,
          [codigo, nomeLimpo, emailLimpo, senhaHash]
        );
        empresa = resultado.rows[0];
      } catch (err: any) {
        if (err.code === "23505" && err.constraint?.includes("codigo")) {
          continue;
        }
        throw err;
      }
    }

    if (!empresa) {
      throw new Error("Não foi possível gerar um código único para a empresa.");
    }

    const token = gerarToken(empresa.id, "EMPRESA", empresa.id);

    return res.status(201).json({
      token,
      usuario: formatarEmpresa(empresa),
    });
  } catch (error) {
    console.error("Erro ao cadastrar empresa:", error);

    return res.status(500).json({
      mensagem: "Não foi possível cadastrar a empresa.",
    });
  }
}

export async function loginEmpresa(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (typeof email !== "string" || typeof senha !== "string") {
    return res.status(400).json({
      mensagem: "E-mail e senha são obrigatórios.",
    });
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const resultado = await pool.query<EmpresaBanco>(
      `
        SELECT
          id,
          codigo,
          nome,
          email,
          senha_hash,
          ativa,
          criada_em,
          atualizada_em
        FROM empresas
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [emailLimpo]
    );

    const empresa = resultado.rows[0];
    const hashParaComparar = empresa ? empresa.senha_hash : DUMMY_HASH;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!empresa || !senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos.",
      });
    }

    if (!empresa.ativa) {
      return res.status(403).json({
        mensagem: "Esta empresa está desativada.",
      });
    }

    const token = gerarToken(empresa.id, "EMPRESA", empresa.id);

    return res.status(200).json({
      token,
      usuario: formatarEmpresa(empresa),
    });
  } catch (error) {
    console.error("Erro no login da empresa:", error);

    return res.status(500).json({
      mensagem: "Não foi possível realizar o login.",
    });
  }
}

export async function loginFuncionario(req: Request, res: Response) {
  const { codigoEmpresa, matricula, senha } = req.body;

  if (
    typeof codigoEmpresa !== "string" ||
    typeof matricula !== "string" ||
    typeof senha !== "string"
  ) {
    return res.status(400).json({
      mensagem: "Código da empresa, matrícula e senha são obrigatórios.",
    });
  }

  const codigoLimpo = codigoEmpresa.trim().toUpperCase();
  const matriculaLimpa = matricula.trim();

  try {
    const resultado = await pool.query<FuncionarioBanco>(
      `
        SELECT
          funcionario.id,
          funcionario.empresa_id,
          funcionario.nome,
          funcionario.usuario,
          funcionario.telefone,
          funcionario.matricula,
          funcionario.senha_hash,
          funcionario.horario_entrada,
          funcionario.horario_saida,
          funcionario.status,
          funcionario.ativo,
          funcionario.criado_em,
          funcionario.atualizado_em
        FROM funcionarios funcionario
        INNER JOIN empresas empresa
          ON empresa.id = funcionario.empresa_id
        WHERE LOWER(empresa.codigo) = LOWER($1)
          AND LOWER(funcionario.matricula) = LOWER($2)
          AND empresa.ativa = TRUE
        LIMIT 1
      `,
      [codigoLimpo, matriculaLimpa]
    );

    const funcionario = resultado.rows[0];
    const hashParaComparar = funcionario ? funcionario.senha_hash : DUMMY_HASH;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!funcionario || !senhaCorreta) {
      return res.status(401).json({
        mensagem: "Código da empresa, matrícula ou senha incorretos.",
      });
    }

    if (!funcionario.ativo) {
      return res.status(403).json({
        mensagem: "Este funcionário está desativado.",
      });
    }

    const token = gerarToken(
      funcionario.id,
      "FUNCIONARIO",
      funcionario.empresa_id
    );

    return res.status(200).json({
      token,
      usuario: formatarFuncionario(funcionario),
    });
  } catch (error) {
    console.error("Erro no login do funcionário:", error);

    return res.status(500).json({
      mensagem: "Não foi possível realizar o login.",
    });
  }
}

export async function buscarUsuarioLogado(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao = req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem: "Usuário não autenticado.",
    });
  }

  try {
    if (autenticacao.perfil === "EMPRESA") {
      const resultado = await pool.query<EmpresaBanco>(
        `
          SELECT
            id,
            codigo,
            nome,
            email,
            senha_hash,
            ativa,
            criada_em,
            atualizada_em
          FROM empresas
          WHERE id = $1
            AND ativa = TRUE
          LIMIT 1
        `,
        [autenticacao.id]
      );

      const empresa = resultado.rows[0];

      if (!empresa) {
        return res.status(404).json({
          mensagem: "Empresa não encontrada.",
        });
      }

      return res.status(200).json(formatarEmpresa(empresa));
    }

    const resultado = await pool.query<FuncionarioBanco>(
      `
        SELECT
          id,
          empresa_id,
          nome,
          usuario,
          telefone,
          matricula,
          senha_hash,
          horario_entrada,
          horario_saida,
          status,
          ativo,
          criado_em,
          atualizado_em
        FROM funcionarios
        WHERE id = $1
          AND empresa_id = $2
          AND ativo = TRUE
        LIMIT 1
      `,
      [autenticacao.id, autenticacao.empresaId]
    );

    const funcionario = resultado.rows[0];

    if (!funcionario) {
      return res.status(404).json({
        mensagem: "Funcionário não encontrado.",
      });
    }

    return res.status(200).json(formatarFuncionario(funcionario));
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      mensagem: "Não foi possível buscar o usuário.",
    });
  }
}