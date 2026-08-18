import { useState } from "react";
import type { FormEvent } from "react";

import {
  cadastrarEmpresa,
  loginEmpresa,
  loginFuncionario,
  salvarSessao,
} from "../services/authService";

interface LoginProps {
  onLogin: () => void;
}

type TipoLogin = "EMPRESA" | "FUNCIONARIO";

export function Login({ onLogin }: LoginProps) {
  const [tipoLogin, setTipoLogin] =
    useState<TipoLogin>("EMPRESA");

  const [modoCadastro, setModoCadastro] =
    useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [matricula, setMatricula] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] =
    useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] =
    useState(false);

  function limparFormulario() {
    setNome("");
    setEmail("");
    setSenha("");
    setMatricula("");
    setCodigoEmpresa("");
    setErro("");
    setModoCadastro(false);
  }

  function selecionarTipoLogin(tipo: TipoLogin) {
    setTipoLogin(tipo);
    limparFormulario();
  }

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      if (tipoLogin === "EMPRESA") {
        if (modoCadastro) {
          const resposta =
            await cadastrarEmpresa({
              nome,
              email,
              senha,
            });

          salvarSessao(
            resposta.token,
            "EMPRESA",
            resposta.usuario
          );

          onLogin();
          return;
        }

        const resposta =
          await loginEmpresa({
            email,
            senha,
          });

        salvarSessao(
          resposta.token,
          "EMPRESA",
          resposta.usuario
        );

        onLogin();
        return;
      }

      const resposta =
        await loginFuncionario({
          codigoEmpresa,
          matricula,
          senha,
        });

      salvarSessao(
        resposta.token,
        "FUNCIONARIO",
        resposta.usuario
      );

      onLogin();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o acesso."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-profile-tabs">
          <button
            type="button"
            className={
              tipoLogin === "EMPRESA"
                ? "active"
                : ""
            }
            onClick={() =>
              selecionarTipoLogin("EMPRESA")
            }
            disabled={carregando}
          >
            Sou empresa
          </button>

          <button
            type="button"
            className={
              tipoLogin === "FUNCIONARIO"
                ? "active"
                : ""
            }
            onClick={() =>
              selecionarTipoLogin("FUNCIONARIO")
            }
            disabled={carregando}
          >
            Sou funcionário
          </button>
        </div>

        <div className="login-logo">
          {tipoLogin === "EMPRESA" ? "N" : "F"}
        </div>

        <p className="login-subtitle">
          Nexus Ponto
        </p>

        <h1>
          {tipoLogin === "EMPRESA"
            ? modoCadastro
              ? "Cadastre sua empresa"
              : "Acesse sua empresa"
            : "Acesse sua conta"}
        </h1>

        <p className="login-description">
          {tipoLogin === "EMPRESA"
            ? "Gerencie funcionários, horários e registros de ponto."
            : "Consulte seus horários e registre sua jornada de trabalho."}
        </p>

        <form
          onSubmit={enviarFormulario}
          className="login-form"
        >
          {tipoLogin === "EMPRESA" ? (
            <>
              {modoCadastro && (
                <label>
                  Nome da empresa

                  <input
                    type="text"
                    value={nome}
                    onChange={(evento) =>
                      setNome(evento.target.value)
                    }
                    placeholder="Ex.: Nexus Tecnologia"
                    autoComplete="organization"
                    disabled={carregando}
                    required
                  />
                </label>
              )}

              <label>
                E-mail

                <input
                  type="email"
                  value={email}
                  onChange={(evento) =>
                    setEmail(evento.target.value)
                  }
                  placeholder="empresa@email.com"
                  autoComplete="email"
                  disabled={carregando}
                  required
                />
              </label>

              <label>
                Senha

                <input
                  type="password"
                  value={senha}
                  onChange={(evento) =>
                    setSenha(evento.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete={
                    modoCadastro
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={4}
                  disabled={carregando}
                  required
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Código da empresa

                <input
                  type="text"
                  value={codigoEmpresa}
                  onChange={(evento) =>
                    setCodigoEmpresa(
                      evento.target.value.toUpperCase()
                    )
                  }
                  placeholder="Ex.: EMP123456"
                  autoComplete="organization"
                  disabled={carregando}
                  required
                />
              </label>

              <label>
                Matrícula

                <input
                  type="text"
                  value={matricula}
                  onChange={(evento) =>
                    setMatricula(evento.target.value)
                  }
                  placeholder="Digite sua matrícula"
                  autoComplete="username"
                  disabled={carregando}
                  required
                />
              </label>

              <label>
                Senha

                <input
                  type="password"
                  value={senha}
                  onChange={(evento) =>
                    setSenha(evento.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  minLength={4}
                  disabled={carregando}
                  required
                />
              </label>
            </>
          )}

          {erro && (
            <p className="login-error">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={carregando}
          >
            {carregando
              ? "Aguarde..."
              : tipoLogin === "EMPRESA" &&
                  modoCadastro
                ? "Criar conta"
                : "Entrar"}
          </button>
        </form>

        {tipoLogin === "EMPRESA" && (
          <button
            type="button"
            className="login-change-mode"
            disabled={carregando}
            onClick={() => {
              setModoCadastro(
                (modoAtual) => !modoAtual
              );

              setNome("");
              setSenha("");
              setErro("");
            }}
          >
            {modoCadastro
              ? "Já possui uma conta? Entrar"
              : "Ainda não possui conta? Cadastrar empresa"}
          </button>
        )}
      </section>
    </main>
  );
}