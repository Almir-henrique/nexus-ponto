import "./config/database";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import empresaRoutes from "./routes/empresaRoutes";
import funcionarioRoutes from "./routes/funcionarioRoutes";
import registroPontoRoutes from "./routes/registroPontoRoutes";
import justificativaRoutes from "./routes/justificativaRoutes";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  return res.status(200).json({
    mensagem: "API Nexus Ponto funcionando",
  });
});

app.get("/api/saude", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    dataHora: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use(
  "/api/empresas",
  empresaRoutes
);

app.use(
  "/api/funcionarios",
  funcionarioRoutes
);

app.use(
  "/api/registros-ponto",
  registroPontoRoutes
);

app.use(
  "/api/justificativas",
  justificativaRoutes
);

app.use((_req, res) => {
  return res.status(404).json({
    mensagem: "Rota não encontrada.",
  });
});

export default app;



