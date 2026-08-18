import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

export type PerfilAutenticado =
  | "EMPRESA"
  | "FUNCIONARIO";

export interface DadosToken {
  id: string;
  perfil: PerfilAutenticado;
  empresaId: string;
}

export interface RequisicaoAutenticada
  extends Request {
  autenticacao?: DadosToken;
}

function payloadValido(
  payload: unknown
): payload is DadosToken {
  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return false;
  }

  const dados = payload as Record<
    string,
    unknown
  >;

  const perfilValido =
    dados.perfil === "EMPRESA" ||
    dados.perfil === "FUNCIONARIO";

  return (
    typeof dados.id === "string" &&
    dados.id.length > 0 &&
    perfilValido &&
    typeof dados.empresaId === "string" &&
    dados.empresaId.length > 0
  );
}

export function autenticar(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      mensagem: "Token não informado.",
    });
  }

  const [tipo, token] =
    authorization.split(" ");

  if (
    tipo !== "Bearer" ||
    !token
  ) {
    return res.status(401).json({
      mensagem: "Token inválido.",
    });
  }

  const segredo =
    process.env.JWT_SECRET;

  if (!segredo) {
    console.error(
      "JWT_SECRET não configurado."
    );

    return res.status(500).json({
      mensagem:
        "Erro interno de autenticação.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      segredo,
      {
        algorithms: ["HS256"],
      }
    );

    if (!payloadValido(payload)) {
      return res.status(401).json({
        mensagem:
          "Token com dados inválidos.",
      });
    }

    req.autenticacao = {
      id: payload.id,
      perfil: payload.perfil,
      empresaId: payload.empresaId,
    };

    return next();
  } catch (error) {
    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        mensagem:
          "Sua sessão expirou. Entre novamente.",
      });
    }

    return res.status(401).json({
      mensagem:
        "Token inválido.",
    });
  }
}