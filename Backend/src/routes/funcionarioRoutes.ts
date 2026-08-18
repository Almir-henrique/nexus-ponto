import { Router } from "express";

import {
  cadastrarFuncionario,
} from "../controllers/funcionarioController";

import {
  listarRegistrosDoFuncionario,
} from "../controllers/registroPontoController";

import {
  autenticar,
} from "../middlewares/authMiddleware";

const funcionarioRoutes = Router();

funcionarioRoutes.post(
  "/",
  autenticar,
  cadastrarFuncionario
);

funcionarioRoutes.get(
  "/:funcionarioId/registros-ponto",
  autenticar,
  listarRegistrosDoFuncionario
);

export default funcionarioRoutes;