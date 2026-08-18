import { useState } from "react";

import {
  Building2,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
} from "lucide-react";

import type { Empresa } from "../types/Empresa";

import {
  atualizarCodigoEmpresa,
  atualizarDadosEmpresa,
  atualizarSenhaEmpresa,
} from "../services/empresaService";

interface ConfiguracoesEmpresaProps {
  empresa: Empresa;

  onEmpresaAtualizada: (
    empresa: Empresa
  ) => void;
}

export function ConfiguracoesEmpresa({
  empresa,
  onEmpresaAtualizada,
}: ConfiguracoesEmpresaProps) {
  const [nome, setNome] =
    useState(empresa.nome);

  const [email, setEmail] =
    useState(empresa.email);

  const [codigo, setCodigo] =
    useState(empresa.codigo);

  const [senhaAtual, setSenhaAtual] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarNovaSenha,
    setConfirmarNovaSenha,
  ] = useState("");

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [
    salvandoDados,
    setSalvandoDados,
  ] = useState(false);

  const [
    salvandoCodigo,
    setSalvandoCodigo,
  ] = useState(false);

  const [
    salvandoSenha,
    setSalvandoSenha,
  ] = useState(false);

  async function salvarDadosEmpresa() {
    if (salvandoDados) {
      return;
    }

    setErro("");
    setMensagem("");
    setSalvandoDados(true);

    try {
      const empresaAtualizada =
        await atualizarDadosEmpresa(
          empresa.id,
          {
            nome,
            email,
          }
        );

      onEmpresaAtualizada(
        empresaAtualizada
      );

      setNome(
        empresaAtualizada.nome
      );

      setEmail(
        empresaAtualizada.email
      );

      setMensagem(
        "Dados da empresa atualizados com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os dados."
      );
    } finally {
      setSalvandoDados(false);
    }
  }

  async function salvarCodigoEmpresa() {
    if (salvandoCodigo) {
      return;
    }

    setErro("");
    setMensagem("");
    setSalvandoCodigo(true);

    try {
      const empresaAtualizada =
        await atualizarCodigoEmpresa(
          empresa.id,
          codigo
        );

      onEmpresaAtualizada(
        empresaAtualizada
      );

      setCodigo(
        empresaAtualizada.codigo
      );

      setMensagem(
        "Código da empresa atualizado com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o código."
      );
    } finally {
      setSalvandoCodigo(false);
    }
  }

  async function salvarSenhaEmpresa() {
    if (salvandoSenha) {
      return;
    }

    setErro("");
    setMensagem("");

    if (!senhaAtual.trim()) {
      setErro(
        "Digite a senha atual."
      );

      return;
    }

    if (novaSenha.length < 4) {
      setErro(
        "A nova senha deve possuir pelo menos 4 caracteres."
      );

      return;
    }

    if (
      novaSenha !==
      confirmarNovaSenha
    ) {
      setErro(
        "A confirmação da nova senha não confere."
      );

      return;
    }

    setSalvandoSenha(true);

    try {
      await atualizarSenhaEmpresa(
        empresa.id,
        {
          senhaAtual,
          novaSenha,
        }
      );

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");

      setMensagem(
        "Senha atualizada com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a senha."
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <section className="empresa-dashboard">
      <div className="empresa-welcome">
        <div>
          <span className="eyebrow">
            Configurações
          </span>

          <h1>
            Área da empresa
          </h1>

          <p>
            Gerencie os dados de acesso e
            identificação da empresa.
          </p>
        </div>

        <Building2 size={32} />
      </div>

      {mensagem && (
        <div className="company-success">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="company-error">
          {erro}
        </div>
      )}

      <section className="company-panel">
        <div className="company-panel-title">
          <div>
            <span className="eyebrow">
              Identificação
            </span>

            <h2>
              Dados da empresa
            </h2>
          </div>

          <Building2 size={25} />
        </div>

        <div className="settings-form">
          <label>
            Nome da empresa

            <div className="settings-input">
              <Building2 size={18} />

              <input
                type="text"
                value={nome}
                onChange={(evento) =>
                  setNome(
                    evento.target.value
                  )
                }
                placeholder="Nome da empresa"
                disabled={salvandoDados}
              />
            </div>
          </label>

          <label>
            E-mail

            <div className="settings-input">
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(evento) =>
                  setEmail(
                    evento.target.value
                  )
                }
                placeholder="empresa@email.com"
                disabled={salvandoDados}
              />
            </div>
          </label>

          <button
            type="button"
            className="primary settings-submit"
            onClick={() => {
              void salvarDadosEmpresa();
            }}
            disabled={salvandoDados}
          >
            <Save size={18} />

            {salvandoDados
              ? "Salvando..."
              : "Salvar dados"}
          </button>
        </div>
      </section>

      <section className="company-panel">
        <div className="company-panel-title">
          <div>
            <span className="eyebrow">
              Acesso dos funcionários
            </span>

            <h2>
              Código da empresa
            </h2>
          </div>

          <KeyRound size={25} />
        </div>

        <p className="settings-description">
          Esse código é usado pelos
          funcionários no momento do
          login.
        </p>

        <div className="settings-form">
          <label>
            Código da empresa

            <div className="settings-input">
              <KeyRound size={18} />

              <input
                type="text"
                value={codigo}
                onChange={(evento) =>
                  setCodigo(
                    evento.target.value
                      .toUpperCase()
                  )
                }
                placeholder="Ex.: EMP123456"
                maxLength={30}
                disabled={
                  salvandoCodigo
                }
              />
            </div>
          </label>

          <button
            type="button"
            className="primary settings-submit"
            onClick={() => {
              void salvarCodigoEmpresa();
            }}
            disabled={salvandoCodigo}
          >
            <Save size={18} />

            {salvandoCodigo
              ? "Salvando..."
              : "Salvar código"}
          </button>
        </div>
      </section>

      <section className="company-panel">
        <div className="company-panel-title">
          <div>
            <span className="eyebrow">
              Segurança
            </span>

            <h2>
              Alterar senha
            </h2>
          </div>

          <LockKeyhole size={25} />
        </div>

        <div className="settings-form">
          <label>
            Senha atual

            <div className="settings-input">
              <LockKeyhole size={18} />

              <input
                type="password"
                value={senhaAtual}
                onChange={(evento) =>
                  setSenhaAtual(
                    evento.target.value
                  )
                }
                placeholder="Digite a senha atual"
                disabled={salvandoSenha}
              />
            </div>
          </label>

          <label>
            Nova senha

            <div className="settings-input">
              <LockKeyhole size={18} />

              <input
                type="password"
                value={novaSenha}
                onChange={(evento) =>
                  setNovaSenha(
                    evento.target.value
                  )
                }
                placeholder="Digite a nova senha"
                minLength={4}
                disabled={salvandoSenha}
              />
            </div>
          </label>

          <label>
            Confirmar nova senha

            <div className="settings-input">
              <LockKeyhole size={18} />

              <input
                type="password"
                value={
                  confirmarNovaSenha
                }
                onChange={(evento) =>
                  setConfirmarNovaSenha(
                    evento.target.value
                  )
                }
                placeholder="Repita a nova senha"
                minLength={4}
                disabled={salvandoSenha}
              />
            </div>
          </label>

          <button
            type="button"
            className="primary settings-submit"
            onClick={() => {
              void salvarSenhaEmpresa();
            }}
            disabled={salvandoSenha}
          >
            <Save size={18} />

            {salvandoSenha
              ? "Salvando..."
              : "Alterar senha"}
          </button>
        </div>
      </section>
    </section>
  );
}