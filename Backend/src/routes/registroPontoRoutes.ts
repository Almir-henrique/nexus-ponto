import { Router } from "express";

import {
  cadastrarRegistroPonto,
} from "../controllers/registroPontoController";

import {
  autenticar,
} from "../middlewares/authMiddleware";

const registroPontoRoutes = Router();

registroPontoRoutes.post(
  "/",
  autenticar,
  cadastrarRegistroPonto
);

export default registroPontoRoutes;