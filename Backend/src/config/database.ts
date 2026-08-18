import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL conectado!");

    client.release();
  })
  .catch((erro) => {
    console.error("❌ Erro ao conectar ao PostgreSQL");
    console.error(erro);
  });