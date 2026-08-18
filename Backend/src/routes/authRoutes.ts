import { Router } from "express";

import {
  buscarUsuarioLogado,
  cadastrarEmpresa,
  loginEmpresa,
  loginFuncionario,
} from "../controllers/authController";

import {
  autenticar,
} from "../middlewares/authMiddleware";

const authRoutes = Router();

authRoutes.post(
  "/empresa/cadastro",
  cadastrarEmpresa
);

authRoutes.post(
  "/empresa/login",
  loginEmpresa
);

authRoutes.post(
  "/funcionario/login",
  loginFuncionario
);

authRoutes.get(
  "/me",
  autenticar,
  buscarUsuarioLogado
);

export default authRoutes;