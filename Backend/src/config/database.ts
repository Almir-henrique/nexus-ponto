import { Pool } from "pg";
import type { QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const databasePort = Number.parseInt(process.env.DB_PORT ?? "5432", 10);

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number.isNaN(databasePort) ? 5432 : databasePort,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Limite máximo de conexões ativas no pool
  idleTimeoutMillis: 30000, // Tempo para fechar conexões ociosas (30s)
  connectionTimeoutMillis: 2000, // Retorna erro se a conexão demorar mais de 2s
  ssl: isProduction ? { rejectUnauthorized: true } : false,
});

pool
  .connect()
  .then((client: { release: () => void }) => {
    console.log("✅ PostgreSQL conectado com sucesso!");
    client.release();
  })
  .catch((error: unknown) => {
    console.error("❌ Erro ao conectar ao PostgreSQL:", error);
  });

// Wrapper reutilizável para executar queries sem precisar importar a instância pool completa
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) => {
  return pool.query<T>(text, params);
};

// Fechamento gracioso do pool quando a aplicação for encerrada (Ctrl+C ou SIGTERM)
const closePool = async (signal: NodeJS.Signals) => {
  try {
    await pool.end();
    console.log(`🔌 Pool do PostgreSQL encerrado (${signal}).`);
    process.exit(0);
  } catch (error: unknown) {
    console.error("❌ Erro ao encerrar o pool do PostgreSQL:", error);
    process.exit(1);
  }
};

process.once("SIGINT", () => void closePool("SIGINT"));
process.once("SIGTERM", () => void closePool("SIGTERM"));