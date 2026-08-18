<<<<<<< HEAD
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createRoot } from "react-dom/client";

import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";

import "./styles.css";

import { Login } from "./pages/Login";
import { DashboardEmpresa } from "./pages/DashboardEmpresa";
import { ConfiguracoesEmpresa } from "./pages/ConfiguracoesEmpresa";
import { JustificativasFuncionario } from "./pages/JustificativasFuncionario";

import {
  buscarEmpresaLogada,
  buscarFuncionarioLogado,
  buscarPerfilLogado,
  estaAutenticado,
  logout,
} from "./services/authService";

import {
  buscarRegistrosDoFuncionarioPorData,
  cadastrarRegistroPonto,
} from "./services/registroPontoService";

import { socket } from "./services/socket";

import type { Empresa } from "./types/Empresa";
import type { Justificativa } from "./types/Justificativa";

import type {
  RegistroPonto,
  TipoPonto,
} from "./types/RegistroPonto";

const channel =
  "BroadcastChannel" in window
    ? new BroadcastChannel("nexus-ponto")
    : null;

const tipoLabel: Record<TipoPonto, string> = {
  ENTRADA: "Entrada",
  INICIO_INTERVALO: "Início do intervalo",
  FIM_INTERVALO: "Retorno do intervalo",
  SAIDA: "Saída",
};

type PaginaEmpresa =
  | "DASHBOARD"
  | "CONFIGURACOES";

type PaginaFuncionario =
  | "PONTO"
  | "JUSTIFICATIVAS";

function obterDataLocal(data: Date): string {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function proximoTipo(
  registrosHoje: RegistroPonto[]
): TipoPonto {
  const sequencia: TipoPonto[] = [
    "ENTRADA",
    "INICIO_INTERVALO",
    "FIM_INTERVALO",
    "SAIDA",
  ];

  const indice = Math.min(
    registrosHoje.length,
    sequencia.length - 1
  );

  return sequencia[indice];
}

function hora(dataHora: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dataHora));
}

function dataCompleta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

function realizarLogout(): void {
  socket.disconnect();
  logout();
  window.location.reload();
}

interface CabecalhoProps {
  paginaEmpresa?: PaginaEmpresa;

  onMudarPaginaEmpresa?: (
    pagina: PaginaEmpresa
  ) => void;

  paginaFuncionario?: PaginaFuncionario;

  onMudarPaginaFuncionario?: (
    pagina: PaginaFuncionario
  ) => void;
}

function Cabecalho({
  paginaEmpresa,
  onMudarPaginaEmpresa,
  paginaFuncionario,
  onMudarPaginaFuncionario,
}: CabecalhoProps) {
  const mostrarNavegacaoEmpresa = Boolean(
    paginaEmpresa &&
      onMudarPaginaEmpresa
  );

  const mostrarNavegacaoFuncionario =
    Boolean(
      paginaFuncionario &&
        onMudarPaginaFuncionario
    );

  return (
    <header className="topbar">
      <div className="brand">
        <Clock3 size={24} />

        <strong>Nexus Ponto</strong>
      </div>

      <div className="topbar-actions">
        {mostrarNavegacaoEmpresa && (
          <nav
            className="company-navigation"
            aria-label="Navegação da empresa"
          >
            <button
              type="button"
              className={
                paginaEmpresa === "DASHBOARD"
                  ? "company-nav-button active"
                  : "company-nav-button"
              }
              onClick={() =>
                onMudarPaginaEmpresa?.(
                  "DASHBOARD"
                )
              }
            >
              <LayoutDashboard size={17} />

              Painel
            </button>

            <button
              type="button"
              className={
                paginaEmpresa ===
                "CONFIGURACOES"
                  ? "company-nav-button active"
                  : "company-nav-button"
              }
              onClick={() =>
                onMudarPaginaEmpresa?.(
                  "CONFIGURACOES"
                )
              }
            >
              <Settings size={17} />

              Configurações
            </button>
          </nav>
        )}

        {mostrarNavegacaoFuncionario && (
          <nav
            className="company-navigation"
            aria-label="Navegação do funcionário"
          >
            <button
              type="button"
              className={
                paginaFuncionario === "PONTO"
                  ? "company-nav-button active"
                  : "company-nav-button"
              }
              onClick={() =>
                onMudarPaginaFuncionario?.(
                  "PONTO"
                )
              }
            >
              <Clock3 size={17} />

              Ponto
            </button>

            <button
              type="button"
              className={
                paginaFuncionario ===
                "JUSTIFICATIVAS"
                  ? "company-nav-button active"
                  : "company-nav-button"
              }
              onClick={() =>
                onMudarPaginaFuncionario?.(
                  "JUSTIFICATIVAS"
                )
              }
            >
              <FileText size={17} />

              Justificativas
            </button>
          </nav>
        )}

        <button
          type="button"
          className="logout-button"
          onClick={realizarLogout}
        >
          <LogOut size={17} />

          Sair
        </button>
      </div>
    </header>
  );
}

function DashboardFuncionario() {
  const funcionarioLogado =
    buscarFuncionarioLogado();

  const [
    paginaFuncionario,
    setPaginaFuncionario,
  ] = useState<PaginaFuncionario>("PONTO");

  const [agora, setAgora] = useState(
    new Date()
  );

  const [registros, setRegistros] =
    useState<RegistroPonto[]>([]);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [
    carregandoRegistros,
    setCarregandoRegistros,
  ] = useState(true);

  const [
    registrandoPonto,
    setRegistrandoPonto,
  ] = useState(false);

  const hoje = obterDataLocal(agora);

  const registrosHoje = useMemo(() => {
    return [...registros].sort(
      (registroA, registroB) =>
        new Date(
          registroA.dataHora
        ).getTime() -
        new Date(
          registroB.dataHora
        ).getTime()
    );
  }, [registros]);

  const proximo =
    proximoTipo(registrosHoje);

  const jornadaConcluida =
    registrosHoje.length >= 4;

  const carregarRegistros =
    useCallback(
      async (
        mostrarCarregamento = true
      ) => {
        if (!funcionarioLogado) {
          setRegistros([]);
          setCarregandoRegistros(false);

          return;
        }

        if (mostrarCarregamento) {
          setCarregandoRegistros(true);
        }

        setErro("");

        try {
          const lista =
            await buscarRegistrosDoFuncionarioPorData(
              funcionarioLogado.id,
              hoje
            );

          setRegistros(lista);
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os registros."
          );
        } finally {
          if (mostrarCarregamento) {
            setCarregandoRegistros(false);
          }
        }
      },
      [
        funcionarioLogado?.id,
        hoje,
      ]
    );

  useEffect(() => {
    if (!funcionarioLogado) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    function entrarNaSala() {
      socket.emit(
        "entrar_funcionario",
        funcionarioLogado?.id
      );
    }

    if (socket.connected) {
      entrarNaSala();
    }

    socket.on("connect", entrarNaSala);

    return () => {
      socket.off("connect", entrarNaSala);
    };
  }, [funcionarioLogado?.id]);

  useEffect(() => {
    function receberAtualizacao(
      justificativa: Justificativa
    ) {
      const status =
        justificativa.status === "APROVADA"
          ? "aprovada"
          : justificativa.status === "RECUSADA"
            ? "recusada"
            : "atualizada";

      const texto =
        `Sua justificativa foi ${status}.`;

      setMensagem(texto);

      if (
        "Notification" in window &&
        Notification.permission ===
          "granted"
      ) {
        new Notification(
          "Justificativa atualizada",
          {
            body:
              justificativa.observacaoEmpresa
                ? `${texto} ${justificativa.observacaoEmpresa}`
                : texto,
          }
        );
      }
    }

    socket.on(
      "justificativa_atualizada",
      receberAtualizacao
    );

    return () => {
      socket.off(
        "justificativa_atualizada",
        receberAtualizacao
      );
    };
  }, []);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setAgora(new Date());
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    void carregarRegistros();
  }, [carregarRegistros]);

  useEffect(() => {
    function atualizarRegistros() {
      void carregarRegistros(false);
    }

    window.addEventListener(
      "storage",
      atualizarRegistros
    );

    channel?.addEventListener(
      "message",
      atualizarRegistros
    );

    return () => {
      window.removeEventListener(
        "storage",
        atualizarRegistros
      );

      channel?.removeEventListener(
        "message",
        atualizarRegistros
      );
    };
  }, [carregarRegistros]);

  useEffect(() => {
    let ultimoMinutoNotificado = "";

    const lembrete =
      window.setInterval(() => {
        const dataAtual = new Date();

        const minutoAtual =
          dataAtual.getMinutes();

        const identificadorMinuto =
          `${dataAtual.getHours()}:${minutoAtual}`;

        if (
          minutoAtual % 30 === 0 &&
          identificadorMinuto !==
            ultimoMinutoNotificado &&
          "Notification" in window &&
          Notification.permission ===
            "granted"
        ) {
          ultimoMinutoNotificado =
            identificadorMinuto;

          new Notification(
            "Nexus Ponto",
            {
              body: "Confira se está no horário de registrar seu próximo ponto.",
            }
          );
        }
      }, 30_000);

    return () => {
      window.clearInterval(lembrete);
    };
  }, []);

  async function ativarNotificacoes() {
    setErro("");

    if (!("Notification" in window)) {
      setMensagem(
        "Este navegador não suporta notificações."
      );

      return;
    }

    const permissao =
      await Notification.requestPermission();

    if (permissao === "granted") {
      setMensagem(
        "Notificações ativadas."
      );

      return;
    }

    setMensagem(
      "Permissão de notificação não concedida."
    );
  }

  async function registrarPonto() {
    if (
      jornadaConcluida ||
      !funcionarioLogado ||
      registrandoPonto
    ) {
      return;
    }

    setRegistrandoPonto(true);
    setErro("");
    setMensagem("");

    try {
      const agoraData = new Date();

      const horaAtual =
        agoraData.getHours();

      const minutoAtual =
        agoraData.getMinutes();

      const horarioEntrada =
        funcionarioLogado.horarioEntrada ||
        "08:00";

      const [
        horaEntrada,
        minutoEntrada,
      ] = horarioEntrada
        .split(":")
        .map(Number);

      const limiteEmMinutos =
        horaEntrada * 60 +
        minutoEntrada +
        5;

      const horarioAtualEmMinutos =
        horaAtual * 60 +
        minutoAtual;

      const atrasado =
        proximo === "ENTRADA" &&
        horarioAtualEmMinutos >
          limiteEmMinutos;

      const novoRegistro =
        await cadastrarRegistroPonto({
          empresaId:
            funcionarioLogado.empresaId,

          funcionarioId:
            funcionarioLogado.id,

          tipo: proximo,

          status: atrasado
            ? "ATRASADO"
            : "NO_HORARIO",
        });

      setRegistros(
        (registrosAtuais) => [
          ...registrosAtuais,
          novoRegistro,
        ]
      );

      channel?.postMessage({
        tipo: "ATUALIZAR_REGISTROS",
        funcionarioId:
          funcionarioLogado.id,
      });

      const texto = `${
        tipoLabel[
          novoRegistro.tipo
        ]
      } registrada às ${hora(
        novoRegistro.dataHora
      )}.`;

      setMensagem(texto);

      if (
        "Notification" in window &&
        Notification.permission ===
          "granted"
      ) {
        new Notification(
          "Ponto registrado",
          {
            body: texto,
          }
        );
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o ponto."
      );
    } finally {
      setRegistrandoPonto(false);
    }
  }

  if (!funcionarioLogado) {
    return (
      <main>
        <Cabecalho />

        <section className="container">
          <div className="panel">
            <h2>
              Funcionário não encontrado
            </h2>

            <p>
              A sessão não foi localizada.
              Entre novamente.
            </p>

            <button
              type="button"
              className="primary"
              onClick={realizarLogout}
            >
              Voltar ao login
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Cabecalho
        paginaFuncionario={
          paginaFuncionario
        }
        onMudarPaginaFuncionario={
          setPaginaFuncionario
        }
      />

      {paginaFuncionario ===
      "JUSTIFICATIVAS" ? (
        <JustificativasFuncionario
          funcionario={funcionarioLogado}
        />
      ) : (
        <section className="container">
          <div className="hero-card">
            <span className="eyebrow">
              Olá, {funcionarioLogado.nome}
            </span>

            <h1>
              {agora.toLocaleTimeString(
                "pt-BR"
              )}
            </h1>

            <p>{dataCompleta(agora)}</p>

            <button
              type="button"
              className="primary"
              onClick={() => {
                void registrarPonto();
              }}
              disabled={
                jornadaConcluida ||
                registrandoPonto ||
                carregandoRegistros
              }
            >
              {jornadaConcluida ? (
                <CheckCircle2 />
              ) : proximo === "SAIDA" ? (
                <LogOut />
              ) : (
                <LogIn />
              )}

              {registrandoPonto
                ? "Registrando..."
                : carregandoRegistros
                  ? "Carregando..."
                  : jornadaConcluida
                    ? "Jornada concluída"
                    : `Registrar ${
                        tipoLabel[proximo]
                      }`}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                void ativarNotificacoes();
              }}
            >
              <Bell size={18} />

              Ativar lembretes
            </button>

            {mensagem && (
              <div className="feedback">
                {mensagem}
              </div>
            )}

            {erro && (
              <div className="login-error">
                {erro}
              </div>
            )}
          </div>

          <div className="panel">
            <h2>
              Meus registros de hoje
            </h2>

            {carregandoRegistros ? (
              <p className="empty">
                Carregando registros...
              </p>
            ) : registrosHoje.length ===
              0 ? (
              <p className="empty">
                Nenhum ponto registrado hoje.
              </p>
            ) : (
              registrosHoje.map(
                (registro) => (
                  <article
                    className="registro"
                    key={registro.id}
                  >
                    <div>
                      <strong>
                        {
                          tipoLabel[
                            registro.tipo
                          ]
                        }
                      </strong>

                      <span>
                        {hora(
                          registro.dataHora
                        )}
                      </span>
                    </div>

                    <span
                      className={
                        registro.status ===
                        "ATRASADO"
                          ? "tag atraso"
                          : "tag"
                      }
                    >
                      {registro.status ===
                      "ATRASADO"
                        ? "Atrasado"
                        : "No horário"}
                    </span>
                  </article>
                )
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function PainelEmpresa() {
  const empresaInicial =
    buscarEmpresaLogada();

  const [empresa, setEmpresa] =
    useState<Empresa | null>(
      empresaInicial
    );

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState<PaginaEmpresa>(
    "DASHBOARD"
  );

  const [
    avisoNovaJustificativa,
    setAvisoNovaJustificativa,
  ] = useState("");

  useEffect(() => {
    if (!empresa) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    function entrarNaSala() {
      socket.emit(
        "entrar_empresa",
        empresa?.id
      );
    }

    if (socket.connected) {
      entrarNaSala();
    }

    socket.on("connect", entrarNaSala);

    return () => {
      socket.off("connect", entrarNaSala);
    };
  }, [empresa?.id]);

  useEffect(() => {
    function receberNovaJustificativa(
      justificativa: Justificativa
    ) {
      const nomeFuncionario =
        justificativa.funcionarioNome ??
        "Um funcionário";

      const texto =
        `${nomeFuncionario} enviou uma nova justificativa.`;

      setAvisoNovaJustificativa(texto);

      if (
        "Notification" in window &&
        Notification.permission ===
          "granted"
      ) {
        new Notification(
          "Nova justificativa",
          {
            body: texto,
          }
        );
      }
    }

    socket.on(
      "nova_justificativa",
      receberNovaJustificativa
    );

    return () => {
      socket.off(
        "nova_justificativa",
        receberNovaJustificativa
      );
    };
  }, []);

  if (!empresa) {
    return (
      <main>
        <Cabecalho />

        <section className="container">
          <div className="panel">
            <h2>
              Empresa não encontrada
            </h2>

            <p>
              A sessão da empresa não foi
              localizada. Faça login
              novamente.
            </p>

            <button
              type="button"
              className="primary"
              onClick={realizarLogout}
            >
              Voltar ao login
            </button>
          </div>
        </section>
      </main>
    );
  }

  function atualizarEmpresa(
    empresaAtualizada: Empresa
  ) {
    setEmpresa(empresaAtualizada);

    localStorage.setItem(
      "nexus-ponto-usuario-logado",
      JSON.stringify(
        empresaAtualizada
      )
    );
  }

  return (
    <main>
      <Cabecalho
        paginaEmpresa={paginaAtual}
        onMudarPaginaEmpresa={
          setPaginaAtual
        }
      />

      {avisoNovaJustificativa && (
        <div
          className="company-success"
          style={{
            margin: "20px auto",
            maxWidth: "1180px",
          }}
        >
          <strong>
            Nova justificativa recebida:
          </strong>{" "}
          {avisoNovaJustificativa}

          <button
            type="button"
            onClick={() =>
              setAvisoNovaJustificativa("")
            }
            style={{
              marginLeft: "12px",
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {paginaAtual ===
      "DASHBOARD" ? (
        <DashboardEmpresa
          empresa={empresa}
        />
      ) : (
        <ConfiguracoesEmpresa
          empresa={empresa}
          onEmpresaAtualizada={
            atualizarEmpresa
          }
        />
      )}
    </main>
  );
}

function App() {
  const [
    autenticado,
    setAutenticado,
  ] = useState(() =>
    estaAutenticado()
  );

  const perfil =
    buscarPerfilLogado();

  if (!autenticado) {
    return (
      <Login
        onLogin={() =>
          setAutenticado(true)
        }
      />
    );
  }

  if (perfil === "EMPRESA") {
    return <PainelEmpresa />;
  }

  if (perfil === "FUNCIONARIO") {
    return (
      <DashboardFuncionario />
    );
  }

  logout();

  return (
    <Login
      onLogin={() =>
        setAutenticado(true)
      }
    />
  );
}

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Elemento com id "root" não encontrado.'
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
=======
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Building2, CheckCircle2, Clock3, LogIn, LogOut, Users } from 'lucide-react';
import './styles.css';

type TipoPonto = 'ENTRADA' | 'INICIO_INTERVALO' | 'FIM_INTERVALO' | 'SAIDA';
type Perfil = 'FUNCIONARIO' | 'EMPRESA';

type Registro = {
  id: string;
  funcionario: string;
  tipo: TipoPonto;
  dataHora: string;
  status: 'NO_HORARIO' | 'ATRASADO';
};

const STORAGE_KEY = 'nexus-ponto-registros';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('nexus-ponto') : null;

const tipoLabel: Record<TipoPonto, string> = {
  ENTRADA: 'Entrada',
  INICIO_INTERVALO: 'Início do intervalo',
  FIM_INTERVALO: 'Retorno do intervalo',
  SAIDA: 'Saída',
};

function lerRegistros(): Registro[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function salvarRegistros(registros: Registro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  channel?.postMessage({ tipo: 'ATUALIZAR_REGISTROS' });
}

function proximoTipo(registrosHoje: Registro[]): TipoPonto {
  const sequencia: TipoPonto[] = ['ENTRADA', 'INICIO_INTERVALO', 'FIM_INTERVALO', 'SAIDA'];
  return sequencia[Math.min(registrosHoje.length, sequencia.length - 1)];
}

function hora(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
}

function dataCompleta(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(date);
}

function App() {
  const [perfil, setPerfil] = useState<Perfil>('FUNCIONARIO');
  const [agora, setAgora] = useState(new Date());
  const [registros, setRegistros] = useState<Registro[]>(lerRegistros());
  const [mensagem, setMensagem] = useState('');

  const funcionario = 'Henrique Dantas';
  const hoje = new Date().toISOString().slice(0, 10);
  const registrosHoje = useMemo(
    () => registros.filter(r => r.dataHora.slice(0, 10) === hoje),
    [registros, hoje]
  );
  const proximo = proximoTipo(registrosHoje);
  const jornadaConcluida = registrosHoje.length >= 4;

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const atualizar = () => setRegistros(lerRegistros());
    window.addEventListener('storage', atualizar);
    channel?.addEventListener('message', atualizar);
    return () => {
      window.removeEventListener('storage', atualizar);
      channel?.removeEventListener('message', atualizar);
    };
  }, []);

  useEffect(() => {
    const lembrete = setInterval(() => {
      const minuto = new Date().getMinutes();
      if (perfil === 'FUNCIONARIO' && minuto % 30 === 0 && Notification.permission === 'granted') {
        new Notification('Nexus Ponto', { body: 'Confira se está no horário de registrar seu próximo ponto.' });
      }
    }, 60_000);
    return () => clearInterval(lembrete);
  }, [perfil]);

  async function ativarNotificacoes() {
    if (!('Notification' in window)) {
      setMensagem('Este navegador não suporta notificações.');
      return;
    }
    const permissao = await Notification.requestPermission();
    setMensagem(permissao === 'granted' ? 'Notificações ativadas.' : 'Permissão de notificação não concedida.');
  }

  function registrarPonto() {
    if (jornadaConcluida) return;
    const agoraIso = new Date().toISOString();
    const horaAtual = new Date().getHours();
    const minutoAtual = new Date().getMinutes();
    const atrasado = proximo === 'ENTRADA' && (horaAtual > 8 || (horaAtual === 8 && minutoAtual > 5));

    const novo: Registro = {
      id: crypto.randomUUID(),
      funcionario,
      tipo: proximo,
      dataHora: agoraIso,
      status: atrasado ? 'ATRASADO' : 'NO_HORARIO',
    };

    const atualizados = [novo, ...registros];
    setRegistros(atualizados);
    salvarRegistros(atualizados);
    setMensagem(`${tipoLabel[proximo]} registrada às ${hora(agoraIso)}.`);

    if (Notification.permission === 'granted') {
      new Notification('Ponto registrado', {
        body: `${tipoLabel[proximo]} registrada às ${hora(agoraIso)}.`
      });
    }
  }

  function limparDemo() {
    localStorage.removeItem(STORAGE_KEY);
    setRegistros([]);
    channel?.postMessage({ tipo: 'ATUALIZAR_REGISTROS' });
    setMensagem('Registros de demonstração apagados.');
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand"><Clock3 size={24}/><strong>Nexus Ponto</strong></div>
        <div className="perfil-switch">
          <button className={perfil === 'FUNCIONARIO' ? 'ativo' : ''} onClick={() => setPerfil('FUNCIONARIO')}><Users size={17}/> Funcionário</button>
          <button className={perfil === 'EMPRESA' ? 'ativo' : ''} onClick={() => setPerfil('EMPRESA')}><Building2 size={17}/> Empresa</button>
        </div>
      </header>

      {perfil === 'FUNCIONARIO' ? (
        <section className="container">
          <div className="hero-card">
            <span className="eyebrow">Olá, {funcionario}</span>
            <h1>{agora.toLocaleTimeString('pt-BR')}</h1>
            <p>{dataCompleta(agora)}</p>
            <button className="primary" onClick={registrarPonto} disabled={jornadaConcluida}>
              {jornadaConcluida ? <CheckCircle2/> : proximo === 'SAIDA' ? <LogOut/> : <LogIn/>}
              {jornadaConcluida ? 'Jornada concluída' : `Registrar ${tipoLabel[proximo]}`}
            </button>
            <button className="secondary" onClick={ativarNotificacoes}><Bell size={18}/> Ativar lembretes</button>
            {mensagem && <div className="feedback">{mensagem}</div>}
          </div>

          <div className="panel">
            <h2>Meus registros de hoje</h2>
            {registrosHoje.length === 0 ? <p className="empty">Nenhum ponto registrado hoje.</p> : registrosHoje.map(r => (
              <article className="registro" key={r.id}>
                <div><strong>{tipoLabel[r.tipo]}</strong><span>{hora(r.dataHora)}</span></div>
                <span className={r.status === 'ATRASADO' ? 'tag atraso' : 'tag'}>{r.status === 'ATRASADO' ? 'Atrasado' : 'No horário'}</span>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="container">
          <div className="dashboard-head">
            <div><span className="eyebrow">Painel da empresa</span><h1>Notificações de ponto</h1></div>
            <button className="secondary" onClick={ativarNotificacoes}><Bell size={18}/> Ativar notificações</button>
          </div>

          <div className="stats">
            <div className="stat"><span>Registros hoje</span><strong>{registrosHoje.length}</strong></div>
            <div className="stat"><span>Atrasos</span><strong>{registrosHoje.filter(r => r.status === 'ATRASADO').length}</strong></div>
            <div className="stat"><span>Funcionários ativos</span><strong>1</strong></div>
          </div>

          <div className="panel">
            <div className="panel-title"><h2>Atividade em tempo real</h2><button className="text-button" onClick={limparDemo}>Limpar demonstração</button></div>
            {registros.length === 0 ? <p className="empty">Quando um funcionário bater o ponto, aparecerá aqui.</p> : registros.map(r => (
              <article className="registro admin" key={r.id}>
                <div className="icon-box"><CheckCircle2 size={19}/></div>
                <div className="grow"><strong>{r.funcionario}</strong><span>{tipoLabel[r.tipo]} registrada às {hora(r.dataHora)}</span></div>
                <span className={r.status === 'ATRASADO' ? 'tag atraso' : 'tag'}>{r.status === 'ATRASADO' ? 'Atrasado' : 'No horário'}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
>>>>>>> 5b871eb (feat: adiciona backend ao repositorio)
