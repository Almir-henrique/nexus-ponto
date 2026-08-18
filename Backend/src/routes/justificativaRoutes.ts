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
  "/funcionarios/:funcionarioID" ,
  autenticar,
  listarJustificativasDoFuncionario
);

justificativaRoutes.get(
  "/empresas/:empresaID" , 
  autenticar,
  listarJustificativasDaEmpresa
);

justificativaRoutes.get(
  "/:id/anexo",
  autenticar,
  baixarAnexoJustificativa
);

justificativaRoutes.patch(
  "/:id/status",
  autenticar,
  atualizarStatusJustificativa
);

export default justificativaRoutes;