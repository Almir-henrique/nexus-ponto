import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Paperclip,
  Plus,
  Send,
  XCircle,
} from "lucide-react";

import type { Funcionario } from "../types/Funcionario";

import type {
  Justificativa,
  TipoJustificativa,
} from "../types/Justificativa";

import {
  buscarJustificativasFuncionario,
  enviarJustificativa,
} from "../services/justificativaService";

interface JustificativasFuncionarioProps {
  funcionario: Funcionario;
}

const tipoLabel: Record<
  TipoJustificativa,
  string
> = {
  ATRASO: "Atraso",
  FALTA: "Falta",
  ESQUECI_PONTO:
    "Esqueci de registrar o ponto",
  SAIDA_ANTECIPADA:
    "Saída antecipada",
  OUTRO: "Outro",
};

function obterDataLocal(): string {
  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(
  data: string
): string {
  const dataLimpa =
    data.includes("T")
      ? data.split("T")[0]
      : data;

  const [ano, mes, dia] =
    dataLimpa.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(
  dataHora?: string | null
): string {
  if (!dataHora) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(dataHora));
}

export function JustificativasFuncionario({
  funcionario,
}: JustificativasFuncionarioProps) {
  const [
    justificativas,
    setJustificativas,
  ] = useState<Justificativa[]>([]);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [tipo, setTipo] =
    useState<TipoJustificativa>(
      "ATRASO"
    );

  const [
    dataOcorrencia,
    setDataOcorrencia,
  ] = useState(obterDataLocal());

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [anexo, setAnexo] =
    useState<File | null>(null);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro("");

      try {
        const lista =
          await buscarJustificativasFuncionario(
            funcionario.id
          );

        setJustificativas(lista);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as justificativas."
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, [funcionario.id]);

  const justificativasOrdenadas =
    useMemo(() => {
      return [...justificativas].sort(
        (a, b) =>
          new Date(
            b.criadaEm
          ).getTime() -
          new Date(
            a.criadaEm
          ).getTime()
      );
    }, [justificativas]);

  function limparFormulario() {
    setTipo("ATRASO");
    setDataOcorrencia(
      obterDataLocal()
    );
    setDescricao("");
    setAnexo(null);
  }

  async function enviar() {
    if (enviando) {
      return;
    }

    setErro("");
    setMensagem("");

    if (!descricao.trim()) {
      setErro(
        "Digite a descrição da justificativa."
      );

      return;
    }

    if (
      anexo &&
      anexo.size >
        5 * 1024 * 1024
    ) {
      setErro(
        "O arquivo deve ter no máximo 5 MB."
      );

      return;
    }

    setEnviando(true);

    try {
      const novaJustificativa =
        await enviarJustificativa({
          tipo,
          dataOcorrencia,
          descricao:
            descricao.trim(),
          anexo,
        });

      setJustificativas(
        (atuais) => [
          novaJustificativa,
          ...atuais,
        ]
      );

      setMensagem(
        "Justificativa enviada com sucesso."
      );

      limparFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a justificativa."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="container">
      <div className="empresa-welcome">
        <div>
          <span className="eyebrow">
            Solicitações
          </span>

          <h1>
            Minhas justificativas
          </h1>

          <p>
            Envie justificativas de
            atrasos, faltas ou registros
            não realizados.
          </p>
        </div>

        <button
          type="button"
          className="primary"
          onClick={() => {
            setMostrarFormulario(
              (atual) => !atual
            );

            setErro("");
            setMensagem("");
          }}
        >
          <Plus size={18} />

          {mostrarFormulario
            ? "Fechar formulário"
            : "Nova justificativa"}
        </button>
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

      {mostrarFormulario && (
        <section className="company-panel">
          <div className="company-panel-title">
            <div>
              <span className="eyebrow">
                Nova solicitação
              </span>

              <h2>
                Enviar justificativa
              </h2>
            </div>

            <FileText size={25} />
          </div>

          <div className="settings-form">
            <label>
              Tipo

              <select
                value={tipo}
                onChange={(evento) =>
                  setTipo(
                    evento.target
                      .value as TipoJustificativa
                  )
                }
                disabled={enviando}
              >
                <option value="ATRASO">
                  Atraso
                </option>

                <option value="FALTA">
                  Falta
                </option>

                <option value="ESQUECI_PONTO">
                  Esqueci de registrar o ponto
                </option>

                <option value="SAIDA_ANTECIPADA">
                  Saída antecipada
                </option>

                <option value="OUTRO">
                  Outro
                </option>
              </select>
            </label>

            <label>
              Data da ocorrência

              <input
                type="date"
                value={dataOcorrencia}
                onChange={(evento) =>
                  setDataOcorrencia(
                    evento.target.value
                  )
                }
                max={obterDataLocal()}
                disabled={enviando}
              />
            </label>

            <label className="settings-full">
              Descrição

              <textarea
                value={descricao}
                onChange={(evento) =>
                  setDescricao(
                    evento.target.value
                  )
                }
                placeholder="Explique o motivo da justificativa."
                rows={5}
                maxLength={1000}
                disabled={enviando}
              />
            </label>

            <label className="settings-full">
              Anexo

              <div className="justification-file-field">
                <Paperclip size={18} />

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(evento) => {
                    const arquivo =
                      evento.target
                        .files?.[0] ??
                      null;

                    setAnexo(arquivo);
                  }}
                  disabled={enviando}
                />
              </div>

              <small>
                PDF, JPG, PNG ou WEBP.
                Máximo de 5 MB.
              </small>

              {anexo && (
                <span className="justification-file-name">
                  {anexo.name}
                </span>
              )}
            </label>

            <button
              type="button"
              className="primary settings-submit"
              onClick={() => {
                void enviar();
              }}
              disabled={enviando}
            >
              <Send size={18} />

              {enviando
                ? "Enviando..."
                : "Enviar justificativa"}
            </button>
          </div>
        </section>
      )}

      <section className="company-panel">
        <div className="company-panel-title">
          <div>
            <span className="eyebrow">
              Histórico
            </span>

            <h2>
              Justificativas enviadas
            </h2>
          </div>

          <Clock3 size={25} />
        </div>

        {carregando ? (
          <div className="company-loading">
            Carregando justificativas...
          </div>
        ) : justificativasOrdenadas.length ===
          0 ? (
          <div className="employee-empty">
            <FileText size={35} />

            <strong>
              Nenhuma justificativa enviada
            </strong>

            <p>
              Suas justificativas aparecerão
              aqui.
            </p>
          </div>
        ) : (
          <div className="justification-list">
            {justificativasOrdenadas.map(
              (justificativa) => (
                <article
                  key={justificativa.id}
                  className="justification-card"
                >
                  <div className="justification-card-header">
                    <div>
                      <span className="eyebrow">
                        {
                          tipoLabel[
                            justificativa.tipo
                          ]
                        }
                      </span>

                      <h3>
                        {formatarData(
                          justificativa.dataOcorrencia
                        )}
                      </h3>
                    </div>

                    <span
                      className={`justification-status justification-status-${justificativa.status.toLowerCase()}`}
                    >
                      {justificativa.status ===
                      "PENDENTE"
                        ? "Pendente"
                        : justificativa.status ===
                            "APROVADA"
                          ? "Aprovada"
                          : "Recusada"}
                    </span>
                  </div>

                  <p className="justification-description">
                    {justificativa.descricao}
                  </p>

                  {justificativa.anexoNome && (
                    <div className="justification-attachment">
                      <Paperclip
                        size={16}
                      />

                      <span>
                        {
                          justificativa.anexoNome
                        }
                      </span>
                    </div>
                  )}

                  {justificativa.observacaoEmpresa && (
                    <div className="justification-company-response">
                      <strong>
                        Resposta da empresa
                      </strong>

                      <p>
                        {
                          justificativa.observacaoEmpresa
                        }
                      </p>
                    </div>
                  )}

                  <div className="justification-meta">
                    <span>
                      <CalendarDays
                        size={15}
                      />

                      Enviada em{" "}
                      {formatarDataHora(
                        justificativa.criadaEm
                      )}
                    </span>

                    {justificativa.status ===
                      "APROVADA" && (
                      <span>
                        <CheckCircle2
                          size={15}
                        />

                        Aprovada
                      </span>
                    )}

                    {justificativa.status ===
                      "RECUSADA" && (
                      <span>
                        <XCircle
                          size={15}
                        />

                        Recusada
                      </span>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </section>
  );
}