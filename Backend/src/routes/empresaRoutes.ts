import { Router } from "express";

import {
  atualizarCodigoEmpresa,
  atualizarDadosEmpresa,
  atualizarSenhaEmpresa,
  listarFuncionariosDaEmpresa,
} from "../controllers/empresaController";

import {
  autenticar,
} from "../middlewares/authMiddleware";

const empresaRoutes = Router();

empresaRoutes.get(
  "/:empresaId/funcionarios",
  autenticar,
  listarFuncionariosDaEmpresa
);

empresaRoutes.patch(
  "/:empresaId/dados",
  autenticar,
  atualizarDadosEmpresa
);

empresaRoutes.patch(
  "/:empresaId/codigo",
  autenticar,
  atualizarCodigoEmpresa
);

empresaRoutes.patch(
  "/:empresaId/senha",
  autenticar,
  atualizarSenhaEmpresa
);

export default empresaRoutes;