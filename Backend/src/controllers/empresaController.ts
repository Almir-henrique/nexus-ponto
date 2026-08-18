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

  entrada_hoje: Date | null;
  inicio_intervalo_hoje: Date | null;
  fim_intervalo_hoje: Date | null;
  saida_hoje: Date | null;
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
    horarioEntrada: funcionario.horario_entrada,
    horarioSaida: funcionario.horario_saida,
    status: funcionario.status,
    ativo: funcionario.ativo,
    criadoEm: funcionario.criado_em,
    atualizadoEm: funcionario.atualizado_em,

    entradaHoje: funcionario.entrada_hoje,
    inicioIntervaloHoje:
      funcionario.inicio_intervalo_hoje,
    fimIntervaloHoje:
      funcionario.fim_intervalo_hoje,
    saidaHoje: funcionario.saida_hoje,
  };
}

function formatarEmpresa(empresa: {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  ativa: boolean;
  criada_em: Date;
  atualizada_em: Date;
}) {
  return {
    id: empresa.id,
    codigo: empresa.codigo,
    nome: empresa.nome,
    email: empresa.email,
    ativa: empresa.ativa,
    criadaEm: empresa.criada_em,
    atualizadoEm: empresa.atualizada_em,
  };
}

function validarAcessoEmpresa(
  req: RequisicaoAutenticada,
  res: Response,
  empresaId: string
): boolean {
  const autenticacao = req.autenticacao;

  if (!autenticacao) {
    res.status(401).json({
      mensagem: "Usuário não autenticado.",
    });

    return false;
  }

  if (
    autenticacao.perfil !== "EMPRESA" ||
    autenticacao.empresaId !== empresaId
  ) {
    res.status(403).json({
      mensagem:
        "Você não possui acesso a esta empresa.",
    });

    return false;
  }

  return true;
}

export async function listarFuncionariosDaEmpresa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const empresaId = String(
    req.params.empresaId
  );

  if (
    !validarAcessoEmpresa(
      req,
      res,
      empresaId
    )
  ) {
    return;
  }

  try {
    const resultado =
      await pool.query<FuncionarioBanco>(
        `
          SELECT
            f.id,
            f.empresa_id,
            f.nome,
            f.usuario,
            f.telefone,
            f.matricula,
            f.horario_entrada,
            f.horario_saida,
            f.status,
            f.ativo,
            f.criado_em,
            f.atualizado_em,

            MAX(
              CASE
                WHEN rp.tipo = 'ENTRADA'
                THEN rp.data_hora
              END
            ) AS entrada_hoje,

            MAX(
              CASE
                WHEN rp.tipo = 'INICIO_INTERVALO'
                THEN rp.data_hora
              END
            ) AS inicio_intervalo_hoje,

            MAX(
              CASE
                WHEN rp.tipo = 'FIM_INTERVALO'
                THEN rp.data_hora
              END
            ) AS fim_intervalo_hoje,

            MAX(
              CASE
                WHEN rp.tipo = 'SAIDA'
                THEN rp.data_hora
              END
            ) AS saida_hoje

          FROM funcionarios f

          LEFT JOIN registros_ponto rp
            ON rp.funcionario_id = f.id
            AND DATE(
              rp.data_hora
              AT TIME ZONE 'America/Recife'
            ) = (
              CURRENT_TIMESTAMP
              AT TIME ZONE 'America/Recife'
            )::date

          WHERE f.empresa_id = $1
            AND f.ativo = TRUE

          GROUP BY
            f.id,
            f.empresa_id,
            f.nome,
            f.usuario,
            f.telefone,
            f.matricula,
            f.horario_entrada,
            f.horario_saida,
            f.status,
            f.ativo,
            f.criado_em,
            f.atualizado_em

          ORDER BY f.criado_em DESC
        `,
        [empresaId]
      );

    return res.status(200).json(
      resultado.rows.map(
        formatarFuncionario
      )
    );
  } catch (error) {
    console.error(
      "Erro ao listar funcionários:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível carregar os funcionários.",
    });
  }
}

export async function atualizarDadosEmpresa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const empresaId = String(
    req.params.empresaId
  );

  const { nome, email } = req.body;

  if (
    !validarAcessoEmpresa(
      req,
      res,
      empresaId
    )
  ) {
    return;
  }

  if (
    typeof nome !== "string" ||
    typeof email !== "string"
  ) {
    return res.status(400).json({
      mensagem:
        "Nome e e-mail são obrigatórios.",
    });
  }

  const nomeLimpo = nome.trim();

  const emailLimpo = email
    .trim()
    .toLowerCase();

  if (!nomeLimpo || !emailLimpo) {
    return res.status(400).json({
      mensagem:
        "Preencha nome e e-mail corretamente.",
    });
  }

  try {
    const emailExistente =
      await pool.query(
        `
          SELECT id
          FROM empresas
          WHERE LOWER(email) = LOWER($1)
            AND id <> $2
          LIMIT 1
        `,
        [emailLimpo, empresaId]
      );

    if (emailExistente.rowCount) {
      return res.status(409).json({
        mensagem:
          "Esse e-mail já está sendo utilizado.",
      });
    }

    const resultado =
      await pool.query(
        `
          UPDATE empresas
          SET
            nome = $1,
            email = $2
          WHERE id = $3
            AND ativa = TRUE
          RETURNING
            id,
            codigo,
            nome,
            email,
            ativa,
            criada_em,
            atualizada_em
        `,
        [
          nomeLimpo,
          emailLimpo,
          empresaId,
        ]
      );

    const empresa = resultado.rows[0];

    if (!empresa) {
      return res.status(404).json({
        mensagem:
          "Empresa não encontrada.",
      });
    }

    return res.status(200).json(
      formatarEmpresa(empresa)
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar dados da empresa:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível atualizar os dados da empresa.",
    });
  }
}

export async function atualizarCodigoEmpresa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const empresaId = String(
    req.params.empresaId
  );

  const { codigo } = req.body;

  if (
    !validarAcessoEmpresa(
      req,
      res,
      empresaId
    )
  ) {
    return;
  }

  if (typeof codigo !== "string") {
    return res.status(400).json({
      mensagem:
        "Informe o novo código da empresa.",
    });
  }

  const codigoLimpo = codigo
    .trim()
    .toUpperCase();

  const formatoValido =
    /^[A-Z0-9_-]{4,30}$/.test(
      codigoLimpo
    );

  if (!formatoValido) {
    return res.status(400).json({
      mensagem:
        "O código deve ter entre 4 e 30 caracteres e usar apenas letras, números, hífen ou sublinhado.",
    });
  }

  try {
    const codigoExistente =
      await pool.query(
        `
          SELECT id
          FROM empresas
          WHERE LOWER(codigo) = LOWER($1)
            AND id <> $2
          LIMIT 1
        `,
        [codigoLimpo, empresaId]
      );

    if (codigoExistente.rowCount) {
      return res.status(409).json({
        mensagem:
          "Esse código já está sendo utilizado por outra empresa.",
      });
    }

    const resultado =
      await pool.query(
        `
          UPDATE empresas
          SET codigo = $1
          WHERE id = $2
            AND ativa = TRUE
          RETURNING
            id,
            codigo,
            nome,
            email,
            ativa,
            criada_em,
            atualizada_em
        `,
        [codigoLimpo, empresaId]
      );

    const empresa = resultado.rows[0];

    if (!empresa) {
      return res.status(404).json({
        mensagem:
          "Empresa não encontrada.",
      });
    }

    return res.status(200).json(
      formatarEmpresa(empresa)
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar código da empresa:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível atualizar o código da empresa.",
    });
  }
}

export async function atualizarSenhaEmpresa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const empresaId = String(
    req.params.empresaId
  );

  const {
    senhaAtual,
    novaSenha,
  } = req.body;

  if (
    !validarAcessoEmpresa(
      req,
      res,
      empresaId
    )
  ) {
    return;
  }

  if (
    typeof senhaAtual !== "string" ||
    typeof novaSenha !== "string"
  ) {
    return res.status(400).json({
      mensagem:
        "Informe a senha atual e a nova senha.",
    });
  }

  if (!senhaAtual.trim()) {
    return res.status(400).json({
      mensagem:
        "Digite a senha atual.",
    });
  }

  if (novaSenha.length < 8) {
    return res.status(400).json({
      mensagem:
        "A nova senha deve possuir pelo menos 8 caracteres.",
    });
  }

  if (senhaAtual === novaSenha) {
    return res.status(400).json({
      mensagem:
        "A nova senha deve ser diferente da senha atual.",
    });
  }

  try {
    const resultado =
      await pool.query<{
        senha_hash: string;
      }>(
        `
          SELECT senha_hash
          FROM empresas
          WHERE id = $1
            AND ativa = TRUE
          LIMIT 1
        `,
        [empresaId]
      );

    const empresa =
      resultado.rows[0];

    if (!empresa) {
      return res.status(404).json({
        mensagem:
          "Empresa não encontrada.",
      });
    }

    const senhaCorreta =
      await bcrypt.compare(
        senhaAtual,
        empresa.senha_hash
      );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem:
          "A senha atual está incorreta.",
      });
    }

    const novaSenhaHash =
      await bcrypt.hash(
        novaSenha,
        12
      );

    await pool.query(
      `
        UPDATE empresas
        SET senha_hash = $1
        WHERE id = $2
      `,
      [
        novaSenhaHash,
        empresaId,
      ]
    );

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Erro ao atualizar senha:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível atualizar a senha.",
    });
  }
}