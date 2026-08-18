import type { Response } from "express";

import { pool } from "../config/database";

import type {
  RequisicaoAutenticada,
} from "../middlewares/authMiddleware";

type TipoPonto =
  | "ENTRADA"
  | "INICIO_INTERVALO"
  | "FIM_INTERVALO"
  | "SAIDA";

type StatusRegistro =
  | "NO_HORARIO"
  | "ATRASADO";

interface RegistroBanco {
  id: string;
  empresa_id: string;
  funcionario_id: string;
  tipo: TipoPonto;
  status: StatusRegistro;
  data_hora: Date;
  observacao: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

interface FuncionarioPontoBanco {
  id: string;
  empresa_id: string;
  horario_entrada: string;
}

const TIPOS_VALIDOS: TipoPonto[] = [
  "ENTRADA",
  "INICIO_INTERVALO",
  "FIM_INTERVALO",
  "SAIDA",
];

const SEQUENCIA_PONTO: TipoPonto[] = [
  "ENTRADA",
  "INICIO_INTERVALO",
  "FIM_INTERVALO",
  "SAIDA",
];

function formatarRegistro(
  registro: RegistroBanco
) {
  return {
    id: registro.id,

    empresaId:
      registro.empresa_id,

    funcionarioId:
      registro.funcionario_id,

    tipo:
      registro.tipo,

    status:
      registro.status,

    dataHora:
      registro.data_hora,

    observacao:
      registro.observacao,

    criadoEm:
      registro.criado_em,

    atualizadoEm:
      registro.atualizado_em,
  };
}

function dataValida(
  data: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      data
    )
  ) {
    return false;
  }

  const [ano, mes, dia] =
    data.split("-").map(Number);

  const objetoData =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );

  return (
    objetoData.getUTCFullYear() === ano &&
    objetoData.getUTCMonth() ===
      mes - 1 &&
    objetoData.getUTCDate() === dia
  );
}

export async function listarRegistrosDoFuncionario(
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

  const data =
    req.query.data;

  /*
   * Funcionário só pode consultar
   * os próprios registros.
   */
  if (
    autenticacao.perfil ===
      "FUNCIONARIO" &&
    autenticacao.id !==
      funcionarioId
  ) {
    return res.status(403).json({
      mensagem:
        "Você não possui acesso aos registros deste funcionário.",
    });
  }

  /*
   * Somente os dois perfis conhecidos
   * podem continuar.
   */
  if (
    autenticacao.perfil !==
      "FUNCIONARIO" &&
    autenticacao.perfil !==
      "EMPRESA"
  ) {
    return res.status(403).json({
      mensagem:
        "Acesso não autorizado.",
    });
  }

  let dataFiltro:
    | string
    | null = null;

  if (
    typeof data === "string" &&
    data.trim()
  ) {
    dataFiltro =
      data.trim();

    if (
      !dataValida(dataFiltro)
    ) {
      return res.status(400).json({
        mensagem:
          "Data inválida.",
      });
    }
  }

  try {
    /*
     * Verifica se o funcionário realmente
     * pertence à empresa presente no JWT.
     */
    const funcionarioResultado =
      await pool.query<{
        id: string;
      }>(
        `
          SELECT id

          FROM funcionarios

          WHERE id = $1
            AND empresa_id = $2
            AND ativo = TRUE

          LIMIT 1
        `,
        [
          funcionarioId,
          autenticacao.empresaId,
        ]
      );

    if (
      !funcionarioResultado.rowCount
    ) {
      return res.status(404).json({
        mensagem:
          "Funcionário não encontrado.",
      });
    }

    if (dataFiltro) {
      const resultado =
        await pool.query<RegistroBanco>(
          `
            SELECT
              id,
              empresa_id,
              funcionario_id,
              tipo,
              status,
              data_hora,
              observacao,
              criado_em,
              atualizado_em

            FROM registros_ponto

            WHERE funcionario_id = $1
              AND empresa_id = $2

              AND (
                data_hora
                AT TIME ZONE
                'America/Recife'
              )::date = $3::date

            ORDER BY
              data_hora ASC
          `,
          [
            funcionarioId,
            autenticacao.empresaId,
            dataFiltro,
          ]
        );

      return res.status(200).json(
        resultado.rows.map(
          formatarRegistro
        )
      );
    }

    const resultado =
      await pool.query<RegistroBanco>(
        `
          SELECT
            id,
            empresa_id,
            funcionario_id,
            tipo,
            status,
            data_hora,
            observacao,
            criado_em,
            atualizado_em

          FROM registros_ponto

          WHERE funcionario_id = $1
            AND empresa_id = $2

          ORDER BY
            data_hora ASC
        `,
        [
          funcionarioId,
          autenticacao.empresaId,
        ]
      );

    return res.status(200).json(
      resultado.rows.map(
        formatarRegistro
      )
    );
  } catch (error) {
    console.error(
      "Erro ao listar registros:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível carregar os registros.",
    });
  }
}

export async function cadastrarRegistroPonto(
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
        "Apenas funcionários podem registrar ponto.",
    });
  }

  /*
   * SEGURANÇA:
   *
   * empresaId e funcionarioId
   * NÃO vêm mais do frontend.
   *
   * Eles vêm exclusivamente
   * do JWT autenticado.
   */
  const empresaId =
    autenticacao.empresaId;

  const funcionarioId =
    autenticacao.id;

  const { tipo } =
    req.body;

  if (
    typeof tipo !== "string" ||
    !TIPOS_VALIDOS.includes(
      tipo as TipoPonto
    )
  ) {
    return res.status(400).json({
      mensagem:
        "Tipo de registro inválido.",
    });
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * FOR UPDATE bloqueia temporariamente
     * esse funcionário durante a transação.
     *
     * Isso ajuda a impedir duas batidas
     * simultâneas.
     */
    const funcionarioResultado =
      await client.query<FuncionarioPontoBanco>(
        `
          SELECT
            id,
            empresa_id,
            horario_entrada

          FROM funcionarios

          WHERE id = $1
            AND empresa_id = $2
            AND ativo = TRUE

          LIMIT 1

          FOR UPDATE
        `,
        [
          funcionarioId,
          empresaId,
        ]
      );

    const funcionario =
      funcionarioResultado.rows[0];

    if (!funcionario) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(403).json({
        mensagem:
          "Funcionário inválido ou desativado.",
      });
    }

    /*
     * Busca as batidas do dia
     * usando o horário de Recife
     * diretamente no PostgreSQL.
     */
    const registrosHoje =
      await client.query<RegistroBanco>(
        `
          SELECT
            id,
            empresa_id,
            funcionario_id,
            tipo,
            status,
            data_hora,
            observacao,
            criado_em,
            atualizado_em

          FROM registros_ponto

          WHERE funcionario_id = $1
            AND empresa_id = $2

            AND (
              data_hora
              AT TIME ZONE
              'America/Recife'
            )::date = (
              CURRENT_TIMESTAMP
              AT TIME ZONE
              'America/Recife'
            )::date

          ORDER BY
            data_hora ASC
        `,
        [
          funcionarioId,
          empresaId,
        ]
      );

    const quantidadeRegistros =
      registrosHoje.rows.length;

    const proximoEsperado =
      SEQUENCIA_PONTO[
        quantidadeRegistros
      ];

    if (!proximoEsperado) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(409).json({
        mensagem:
          "A jornada de hoje já foi concluída.",
      });
    }

    if (
      tipo !==
      proximoEsperado
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(409).json({
        mensagem:
          `O próximo registro deve ser ${proximoEsperado}.`,
      });
    }

    let status:
      StatusRegistro =
      "NO_HORARIO";

    /*
     * Para entrada, deixa o PostgreSQL
     * calcular a hora atual de Recife.
     *
     * Assim não dependemos do relógio
     * ou timezone do navegador.
     */
    if (tipo === "ENTRADA") {
      const horarioResultado =
        await client.query<{
          minutos_agora: number;
        }>(
          `
            SELECT
              (
                EXTRACT(
                  HOUR FROM
                  CURRENT_TIMESTAMP
                  AT TIME ZONE
                  'America/Recife'
                ) * 60

                +

                EXTRACT(
                  MINUTE FROM
                  CURRENT_TIMESTAMP
                  AT TIME ZONE
                  'America/Recife'
                )
              )::integer
              AS minutos_agora
          `
        );

      const minutosAgora =
        Number(
          horarioResultado
            .rows[0]
            .minutos_agora
        );

      const horarioEntrada =
        String(
          funcionario
            .horario_entrada
        );

      const [
        horaEntrada,
        minutoEntrada,
      ] = horarioEntrada
        .slice(0, 5)
        .split(":")
        .map(Number);

      const limiteEmMinutos =
        horaEntrada * 60 +
        minutoEntrada +
        5;

      if (
        minutosAgora >
        limiteEmMinutos
      ) {
        status =
          "ATRASADO";
      }
    }

    const resultado =
      await client.query<RegistroBanco>(
        `
          INSERT INTO registros_ponto (
            empresa_id,
            funcionario_id,
            tipo,
            status
          )

          VALUES (
            $1,
            $2,
            $3,
            $4
          )

          RETURNING
            id,
            empresa_id,
            funcionario_id,
            tipo,
            status,
            data_hora,
            observacao,
            criado_em,
            atualizado_em
        `,
        [
          empresaId,
          funcionarioId,
          tipo,
          status,
        ]
      );

    if (tipo === "ENTRADA") {
      await client.query(
        `
          UPDATE funcionarios

          SET status = $1

          WHERE id = $2
            AND empresa_id = $3
        `,
        [
          status === "ATRASADO"
            ? "ATRASADO"
            : "PRESENTE",

          funcionarioId,
          empresaId,
        ]
      );
    }

    if (tipo === "SAIDA") {
      await client.query(
        `
          UPDATE funcionarios

          SET status =
            'NAO_REGISTRADO'

          WHERE id = $1
            AND empresa_id = $2
        `,
        [
          funcionarioId,
          empresaId,
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    return res.status(201).json(
      formatarRegistro(
        resultado.rows[0]
      )
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Erro ao registrar ponto:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível registrar o ponto.",
    });
  } finally {
    client.release();
  }
}