import type { Response } from "express";
import bcrypt from "bcrypt";

import { pool } from "../config/database";

import type {
  RequisicaoAutenticada,
} from "../middlewares/authMiddleware";

interface FuncionarioBanco {
  id: string;
  empresa_id: string;
  nome: string;
  usuario: string;
  telefone: string;
  matricula: string;
  horario_entrada: string;
  horario_saida: string;
  status: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

function formatarFuncionario(
  funcionario: FuncionarioBanco
) {
  return {
    id: funcionario.id,
    empresaId: funcionario.empresa_id,
    nome: funcionario.nome,
    usuario: funcionario.usuario,
    telefone: funcionario.telefone,
    matricula: funcionario.matricula,
    horarioEntrada:
      funcionario.horario_entrada,
    horarioSaida:
      funcionario.horario_saida,
    status: funcionario.status,
    ativo: funcionario.ativo,
    criadoEm: funcionario.criado_em,
    atualizadoEm:
      funcionario.atualizado_em,
  };
}

export async function cadastrarFuncionario(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao = req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem: "Usuário não autenticado.",
    });
  }

  if (autenticacao.perfil !== "EMPRESA") {
    return res.status(403).json({
      mensagem:
        "Apenas empresas podem cadastrar funcionários.",
    });
  }

  const {
    empresaId,
    nome,
    usuario,
    telefone,
    matricula,
    senha,
    horarioEntrada,
    horarioSaida,
  } = req.body;

  if (
    typeof empresaId !== "string" ||
    typeof nome !== "string" ||
    typeof usuario !== "string" ||
    typeof telefone !== "string" ||
    typeof matricula !== "string" ||
    typeof senha !== "string" ||
    typeof horarioEntrada !== "string" ||
    typeof horarioSaida !== "string"
  ) {
    return res.status(400).json({
      mensagem:
        "Todos os campos são obrigatórios.",
    });
  }

  if (autenticacao.empresaId !== empresaId) {
    return res.status(403).json({
      mensagem:
        "Você não pode cadastrar funcionários em outra empresa.",
    });
  }

  const nomeLimpo = nome.trim();
  const usuarioLimpo = usuario.trim();
  const telefoneLimpo = telefone.trim();
  const matriculaLimpa = matricula.trim();

  if (
    !nomeLimpo ||
    !usuarioLimpo ||
    !telefoneLimpo ||
    !matriculaLimpa
  ) {
    return res.status(400).json({
      mensagem:
        "Preencha todos os campos corretamente.",
    });
  }

  if (senha.length < 4) {
    return res.status(400).json({
      mensagem:
        "A senha deve possuir pelo menos 4 caracteres.",
    });
  }

  try {
    const duplicado = await pool.query(
      `
        SELECT id
        FROM funcionarios
        WHERE empresa_id = $1
          AND (
            LOWER(usuario) = LOWER($2)
            OR LOWER(matricula) = LOWER($3)
          )
        LIMIT 1
      `,
      [
        empresaId,
        usuarioLimpo,
        matriculaLimpa,
      ]
    );

    if (duplicado.rowCount) {
      return res.status(409).json({
        mensagem:
          "Já existe um funcionário com esse usuário ou matrícula.",
      });
    }

    const senhaHash = await bcrypt.hash(
      senha,
      12
    );

    const resultado =
      await pool.query<FuncionarioBanco>(
        `
          INSERT INTO funcionarios (
            empresa_id,
            nome,
            usuario,
            telefone,
            matricula,
            senha_hash,
            horario_entrada,
            horario_saida
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          RETURNING
            id,
            empresa_id,
            nome,
            usuario,
            telefone,
            matricula,
            horario_entrada,
            horario_saida,
            status,
            ativo,
            criado_em,
            atualizado_em
        `,
        [
          empresaId,
          nomeLimpo,
          usuarioLimpo,
          telefoneLimpo,
          matriculaLimpa,
          senhaHash,
          horarioEntrada,
          horarioSaida,
        ]
      );

    return res.status(201).json(
      formatarFuncionario(
        resultado.rows[0]
      )
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar funcionário:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível cadastrar o funcionário.",
    });
  }
}