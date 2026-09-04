import { Router } from "express";

import {
  atualizarStatusJustificativa,
  baixarAnexoJustificativa,
  cadastrarJustificativa,
  listarJustificativasDaEmpresa,
  listarJustificativasDoFuncionario,
} from "../controllers/justificativaController";

import {
  autenticar,
} from "../middlewares/authMiddleware";

import {
  uploadJustificativa,
} from "../middlewares/uploadJustificativa";

const justificativaRoutes = Router();

justificativaRoutes.post(
  "/",
  autenticar,
  uploadJustificativa.single("anexo"),
  cadastrarJustificativa
);

justificativaRoutes.get(
  "/funcionarios/:funcionarioId",
  autenticar,
  listarJustificativasDoFuncionario
);

justificativaRoutes.get(
  "/empresas/:empresaId",
  autenticar,
  listarJustificativasDaEmpresa
);

justificativaRoutes.get(
  "/id/:id/anexo",
  autenticar,
  baixarAnexoJustificativa
);

justificativaRoutes.patch(
  "/:id/status",
  autenticar,
  atualizarStatusJustificativa
);

export default justificativaRoutes;