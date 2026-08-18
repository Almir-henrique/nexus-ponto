import dotenv from "dotenv";

import http from "http";

import { Server } from "socket.io";

import app from "./app";

dotenv.config();

const PORT = Number(
  process.env.PORT || 3000
);

const servidor =
  http.createServer(app);

const io = new Server(servidor, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(
    "Cliente conectado:",
    socket.id
  );

  socket.on(
    "entrar_empresa",
    (empresaId: string) => {
      socket.join(
        `empresa:${empresaId}`
      );

      console.log(
        `Empresa ${empresaId} conectada`
      );
    }
  );

  socket.on(
    "entrar_funcionario",
    (funcionarioId: string) => {
      socket.join(
        `funcionario:${funcionarioId}`
      );

      console.log(
        `Funcionário ${funcionarioId} conectado`
      );
    }
  );

  socket.on("disconnect", () => {
    console.log(
      "Cliente desconectado:",
      socket.id
    );
  });
});

servidor.listen(PORT, () => {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});