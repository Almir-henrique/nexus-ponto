import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { DashboardEmpresa } from "./pages/DashboardEmpresa";

export function App() {
  const [perfilLogado, setPerfilLogado] = useState<string | null>(null);

  useEffect(() => {
    const perfil = localStorage.getItem("nexus-ponto-perfil-logado");
    if (perfil) {
      setPerfilLogado(perfil);
    }
  }, []);

  if (!perfilLogado) {
    return <Login />;
  }

  if (perfilLogado === "empresa") {
    return <DashboardEmpresa />;
  }

  return (
    <div style={{ padding: "2rem", color: "#fff", background: "#0f172a", minHeight: "100vh" }}>
      <h1>Painel do Funcionário</h1>
      <button
        onClick={() => {
          localStorage.removeItem("nexus-ponto-perfil-logado");
          setPerfilLogado(null);
        }}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Sair
      </button>
    </div>
  );
}

export default App;