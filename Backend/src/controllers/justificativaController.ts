import type { Response } from "express";
import type { Server } from "socket.io";

import path from "path";
import { access } from "fs/promises";

import { pool } from "../config/database";

import type {
  RequisicaoAutenticada,
} from "../middlewares/authMiddleware";

type TipoJustificativa =
  | "ATRASO"
  | "FALTA"
  | "ESQUECI_PONTO"
  | "SAIDA_ANTECIPADA"
  | "OUTRO";

type StatusJustificativa =
  | "PENDENTE"
  | "APROVADA"
  | "RECUSADA";

interface JustificativaBanco {
  id: string;
  empresa_id: string;
  funcionario_id: string;

  tipo: TipoJustificativa;
  data_ocorrencia: string;
  descricao: string;

  status: StatusJustificativa;

  observacao_empresa: string | null;
  analisada_em: Date | null;

  anexo_nome: string | null;
  anexo_url: string | null;
  anexo_tipo: string | null;
  anexo_tamanho: number | null;

  criada_em: Date;
  atualizada_em: Date;

  funcionario_nome?: string;
  funcionario_matricula?: string;
}

const TIPOS_VALIDOS: TipoJustificativa[] = [
  "ATRASO",
  "FALTA",
  "ESQUECI_PONTO",
  "SAIDA_ANTECIPADA",
  "OUTRO",
];

const STATUS_ANALISE_VALIDOS: StatusJustificativa[] = [
  "APROVADA",
  "RECUSADA",
];

function formatarJustificativa(
  justificativa: JustificativaBanco
) {
  return {
    id: justificativa.id,
    empresaId: justificativa.empresa_id,
    funcionarioId:
      justificativa.funcionario_id,
    tipo: justificativa.tipo,
    dataOcorrencia:
      justificativa.data_ocorrencia,
    descricao: justificativa.descricao,
    status: justificativa.status,
    observacaoEmpresa:
      justificativa.observacao_empresa,
    analisadaEm:
      justificativa.analisada_em,
    anexoNome:
      justificativa.anexo_nome,
    anexoUrl:
      justificativa.anexo_url,
    anexoTipo:
      justificativa.anexo_tipo,
    anexoTamanho:
      justificativa.anexo_tamanho,
    criadaEm:
      justificativa.criada_em,
    atualizadaEm:
      justificativa.atualizada_em,
    funcionarioNome:
      justificativa.funcionario_nome,
    funcionarioMatricula:
      justificativa.funcionario_matricula,
  };
}

function obterSocket(
  req: RequisicaoAutenticada
): Server | null {
  const io = req.app.get("io") as
    | Server
    | undefined;

  return io ?? null;
}

function dataISOValida(
  valor: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const [ano, mes, dia] =
    valor.split("-").map(Number);

  const data = new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia
    )
  );

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

export async function cadastrarJustificativa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao =
    req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem:
        "Usuário não autenticado.",
    });
  }

  if (
    autenticacao.perfil !==
    "FUNCIONARIO"
  ) {
    return res.status(403).json({
      mensagem:
        "Apenas funcionários podem enviar justificativas.",
    });
  }

  const empresaId =
    autenticacao.empresaId;

  const funcionarioId =
    autenticacao.id;

  const {
    tipo,
    dataOcorrencia,
    descricao,
  } = req.body;

  if (
    typeof tipo !== "string" ||
    typeof dataOcorrencia !== "string" ||
    typeof descricao !== "string"
  ) {
    return res.status(400).json({
      mensagem:
        "Preencha todos os campos da justificativa.",
    });
  }

  if (
    !TIPOS_VALIDOS.includes(
      tipo as TipoJustificativa
    )
  ) {
    return res.status(400).json({
      mensagem:
        "Tipo de justificativa inválido.",
    });
  }

  if (
    !dataISOValida(
      dataOcorrencia
    )
  ) {
    return res.status(400).json({
      mensagem:
        "Data da ocorrência inválida.",
    });
  }

  const descricaoLimpa =
    descricao.trim();

  if (!descricaoLimpa) {
    return res.status(400).json({
      mensagem:
        "Digite a descrição da justificativa.",
    });
  }

  if (
    descricaoLimpa.length > 1000
  ) {
    return res.status(400).json({
      mensagem:
        "A descrição deve possuir no máximo 1000 caracteres.",
    });
  }

  const anexoNome =
    req.file?.originalname ?? null;

  const anexoUrl =
    req.file
      ? `/uploads/justificativas/${req.file.filename}`
      : null;

  const anexoTipo =
    req.file?.mimetype ?? null;

  const anexoTamanho =
    req.file?.size ?? null;

  try {
    const funcionarioResultado =
      await pool.query<{
        id: string;
        nome: string;
        matricula: string;
      }>(
        `
          SELECT
            id,
            nome,
            matricula
          FROM funcionarios
          WHERE id = $1
            AND empresa_id = $2
            AND ativo = TRUE
          LIMIT 1
        `,
        [
          funcionarioId,
          empresaId,
        ]
      );

    const funcionario =
      funcionarioResultado.rows[0];

    if (!funcionario) {
      return res.status(403).json({
        mensagem:
          "Funcionário inválido ou desativado.",
      });
    }

    const resultado =
      await pool.query<JustificativaBanco>(
        `
          INSERT INTO justificativas (
            empresa_id,
            funcionario_id,
            tipo,
            data_ocorrencia,
            descricao,
            anexo_nome,
            anexo_url,
            anexo_tipo,
            anexo_tamanho
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
          )
          RETURNING
            id,
            empresa_id,
            funcionario_id,
            tipo,
            data_ocorrencia,
            descricao,
            status,
            observacao_empresa,
            analisada_em,
            anexo_nome,
            anexo_url,
            anexo_tipo,
            anexo_tamanho,
            criada_em,
            atualizada_em
        `,
        [
          empresaId,
          funcionarioId,
          tipo,
          dataOcorrencia,
          descricaoLimpa,
          anexoNome,
          anexoUrl,
          anexoTipo,
          anexoTamanho,
        ]
      );

    const justificativaBanco =
      resultado.rows[0];

    justificativaBanco.funcionario_nome =
      funcionario.nome;

    justificativaBanco.funcionario_matricula =
      funcionario.matricula;

    const justificativa =
      formatarJustificativa(
        justificativaBanco
      );

    const io =
      obterSocket(req);

    io?.to(
      `empresa:${empresaId}`
    ).emit(
      "nova_justificativa",
      justificativa
    );

    return res.status(201).json(
      justificativa
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar justificativa:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível enviar a justificativa.",
    });
  }
}

export async function listarJustificativasDoFuncionario(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao =
    req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem:
        "Usuário não autenticado.",
    });
  }

  const funcionarioId =
    String(
      req.params.funcionarioId
    );

  console.log(
    "ID do JWT:",
    autenticacao.id
  );

  console.log(
    "ID recebido na URL:",
    funcionarioId
  );

  console.log(
    "Empresa do JWT:",
    autenticacao.empresaId
  );

  console.log(
    "Perfil:",
    autenticacao.perfil
  );

  if (
    autenticacao.perfil ===
      "FUNCIONARIO" &&
    autenticacao.id !==
      funcionarioId
  ) {
    return res.status(403).json({
      mensagem:
        "Você não possui acesso às justificativas deste funcionário.",
    });
  }

  try {
    const resultado =
      await pool.query<JustificativaBanco>(
        `
          SELECT
            j.id,
            j.empresa_id,
            j.funcionario_id,
            j.tipo,
            j.data_ocorrencia,
            j.descricao,
            j.status,
            j.observacao_empresa,
            j.analisada_em,
            j.anexo_nome,
            j.anexo_url,
            j.anexo_tipo,
            j.anexo_tamanho,
            j.criada_em,
            j.atualizada_em,
            f.nome AS funcionario_nome,
            f.matricula AS funcionario_matricula
          FROM justificativas j
          INNER JOIN funcionarios f
            ON f.id = j.funcionario_id
          WHERE j.funcionario_id = $1
            AND j.empresa_id = $2
            AND f.empresa_id = $2
          ORDER BY j.criada_em DESC
        `,
        [
          funcionarioId,
          autenticacao.empresaId,
        ]
      );

    console.log(
      "Justificativas encontradas:",
      resultado.rowCount
    );

    return res.status(200).json(
      resultado.rows.map(
        formatarJustificativa
      )
    );
  } catch (error) {
    console.error(
      "Erro ao listar justificativas do funcionário:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível carregar as justificativas.",
    });
  }
}

export async function listarJustificativasDaEmpresa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao =
    req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem:
        "Usuário não autenticado.",
    });
  }

  if (
    autenticacao.perfil !==
    "EMPRESA"
  ) {
    return res.status(403).json({
      mensagem:
        "Apenas empresas podem consultar todas as justificativas.",
    });
  }

  const empresaIdRota =
    String(
      req.params.empresaId
    );

  if (
    empresaIdRota !==
    autenticacao.empresaId
  ) {
    return res.status(403).json({
      mensagem:
        "Você não possui acesso às justificativas desta empresa.",
    });
  }

  const empresaId =
    autenticacao.empresaId;

  try {
    const resultado =
      await pool.query<JustificativaBanco>(
        `
          SELECT
            j.id,
            j.empresa_id,
            j.funcionario_id,
            j.tipo,
            j.data_ocorrencia,
            j.descricao,
            j.status,
            j.observacao_empresa,
            j.analisada_em,
            j.anexo_nome,
            j.anexo_url,
            j.anexo_tipo,
            j.anexo_tamanho,
            j.criada_em,
            j.atualizada_em,
            f.nome AS funcionario_nome,
            f.matricula AS funcionario_matricula
          FROM justificativas j
          INNER JOIN funcionarios f
            ON f.id = j.funcionario_id
          WHERE j.empresa_id = $1
            AND f.empresa_id = $1
          ORDER BY
            CASE
              WHEN j.status = 'PENDENTE'
              THEN 0
              ELSE 1
            END,
            j.criada_em DESC
        `,
        [empresaId]
      );

    return res.status(200).json(
      resultado.rows.map(
        formatarJustificativa
      )
    );
  } catch (error) {
    console.error(
      "Erro ao listar justificativas da empresa:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível carregar as justificativas.",
    });
  }
}

export async function baixarAnexoJustificativa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao =
    req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem:
        "Usuário não autenticado.",
    });
  }

  const id = String(
    req.params.id
  );

  try {
    const resultado =
      await pool.query<{
        empresa_id: string;
        funcionario_id: string;
        anexo_nome: string | null;
        anexo_url: string | null;
        anexo_tipo: string | null;
      }>(
        `
          SELECT
            empresa_id,
            funcionario_id,
            anexo_nome,
            anexo_url,
            anexo_tipo
          FROM justificativas
          WHERE id = $1
            AND empresa_id = $2
          LIMIT 1
        `,
        [
          id,
          autenticacao.empresaId,
        ]
      );

    const justificativa =
      resultado.rows[0];

    if (!justificativa) {
      return res.status(404).json({
        mensagem:
          "Justificativa não encontrada.",
      });
    }

    if (
      autenticacao.perfil ===
        "FUNCIONARIO" &&
      justificativa.funcionario_id !==
        autenticacao.id
    ) {
      return res.status(403).json({
        mensagem:
          "Você não possui acesso a este anexo.",
      });
    }

    if (
      !justificativa.anexo_url ||
      !justificativa.anexo_nome
    ) {
      return res.status(404).json({
        mensagem:
          "Esta justificativa não possui anexo.",
      });
    }

    const nomeArquivo =
      path.basename(
        justificativa.anexo_url
      );

    const caminhoArquivo =
      path.resolve(
        process.cwd(),
        "uploads",
        "justificativas",
        nomeArquivo
      );

    try {
      await access(
        caminhoArquivo
      );
    } catch {
      return res.status(404).json({
        mensagem:
          "Arquivo não encontrado.",
      });
    }

    if (
      justificativa.anexo_tipo
    ) {
      res.setHeader(
        "Content-Type",
        justificativa.anexo_tipo
      );
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(
        justificativa.anexo_nome
      )}"`
    );

    return res.sendFile(
      caminhoArquivo
    );
  } catch (error) {
    console.error(
      "Erro ao abrir anexo:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível abrir o anexo.",
    });
  }
}

export async function atualizarStatusJustificativa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const autenticacao =
    req.autenticacao;

  if (!autenticacao) {
    return res.status(401).json({
      mensagem:
        "Usuário não autenticado.",
    });
  }

  if (
    autenticacao.perfil !==
    "EMPRESA"
  ) {
    return res.status(403).json({
      mensagem:
        "Apenas empresas podem analisar justificativas.",
    });
  }

  const id = String(
    req.params.id
  );

  const {
    status,
    observacaoEmpresa,
  } = req.body;

  if (
    typeof status !== "string" ||
    !STATUS_ANALISE_VALIDOS.includes(
      status as StatusJustificativa
    )
  ) {
    return res.status(400).json({
      mensagem:
        "Informe um status válido.",
    });
  }

  if (
    observacaoEmpresa !== undefined &&
    typeof observacaoEmpresa !==
      "string"
  ) {
    return res.status(400).json({
      mensagem:
        "A observação da empresa é inválida.",
    });
  }

  const observacaoLimpa =
    typeof observacaoEmpresa ===
    "string"
      ? observacaoEmpresa.trim()
      : "";

  if (
    observacaoLimpa.length > 1000
  ) {
    return res.status(400).json({
      mensagem:
        "A observação deve possuir no máximo 1000 caracteres.",
    });
  }

  try {
    const resultado =
      await pool.query<JustificativaBanco>(
        `
          UPDATE justificativas
          SET
            status = $1,
            observacao_empresa = $2,
            analisada_em = NOW()
          WHERE id = $3
            AND empresa_id = $4
          RETURNING
            id,
            empresa_id,
            funcionario_id,
            tipo,
            data_ocorrencia,
            descricao,
            status,
            observacao_empresa,
            analisada_em,
            anexo_nome,
            anexo_url,
            anexo_tipo,
            anexo_tamanho,
            criada_em,
            atualizada_em
        `,
        [
          status,
          observacaoLimpa || null,
          id,
          autenticacao.empresaId,
        ]
      );

    const justificativaBanco =
      resultado.rows[0];

    if (!justificativaBanco) {
      return res.status(404).json({
        mensagem:
          "Justificativa não encontrada.",
      });
    }

    const justificativa =
      formatarJustificativa(
        justificativaBanco
      );

    const io =
      obterSocket(req);

    io?.to(
      `funcionario:${justificativaBanco.funcionario_id}`
    ).emit(
      "justificativa_atualizada",
      justificativa
    );

    io?.to(
      `empresa:${autenticacao.empresaId}`
    ).emit(
      "justificativa_atualizada",
      justificativa
    );

    return res.status(200).json(
      justificativa
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar justificativa:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível analisar a justificativa.",
    });
  }
}