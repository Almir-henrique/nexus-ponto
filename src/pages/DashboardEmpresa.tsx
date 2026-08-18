import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormEvent } from "react";

import {
  Building2,
  Clock3,
  FileText,
  Paperclip,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";

import type { Empresa } from "../types/Empresa";
import type { Funcionario } from "../types/Funcionario";
import type { Justificativa } from "../types/Justificativa";

import {
  buscarFuncionariosDaEmpresa,
  cadastrarFuncionario,
  excluirFuncionario,
} from "../services/funcionarioService";

import {
  analisarJustificativa,
  buscarJustificativasEmpresa,
} from "../services/justificativaService";

import { socket } from "../services/socket";

interface DashboardEmpresaProps {
  empresa: Empresa;
}

export function DashboardEmpresa({
  empresa,
}: DashboardEmpresaProps) {
  const [funcionarios, setFuncionarios] =
    useState<Funcionario[]>([]);

  const [
    justificativas,
    setJustificativas,
  ] = useState<Justificativa[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [
    carregandoJustificativas,
    setCarregandoJustificativas,
  ] = useState(true);

  const [cadastrando, setCadastrando] =
    useState(false);

  const [
    funcionarioExcluindo,
    setFuncionarioExcluindo,
  ] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefone, setTelefone] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");

  const [horarioEntrada, setHorarioEntrada] =
    useState("08:00");

  const [horarioSaida, setHorarioSaida] =
    useState("17:00");

  useEffect(() => {
    async function carregarFuncionarios() {
      setCarregando(true);
      setErro("");

      try {
        const lista =
          await buscarFuncionariosDaEmpresa(
            empresa.id
          );

        setFuncionarios(lista);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os funcionários."
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregarFuncionarios();
  }, [empresa.id]);

  useEffect(() => {
    async function carregarJustificativas() {
      setCarregandoJustificativas(true);

      try {
        const lista =
          await buscarJustificativasEmpresa(
            empresa.id
          );

        setJustificativas(lista);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as justificativas."
        );
      } finally {
        setCarregandoJustificativas(false);
      }
    }

    void carregarJustificativas();

    function receberNovaJustificativa(
      justificativa: Justificativa
    ) {
      setJustificativas(
        (atuais) => [
          justificativa,
          ...atuais,
        ]
      );
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
  }, [empresa.id]);

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca
      .toLowerCase()
      .trim();

    if (!termo) {
      return funcionarios;
    }

    return funcionarios.filter(
      (funcionario) => {
        return (
          funcionario.nome
            .toLowerCase()
            .includes(termo) ||
          funcionario.usuario
            .toLowerCase()
            .includes(termo) ||
          funcionario.matricula
            .toLowerCase()
            .includes(termo)
        );
      }
    );
  }, [busca, funcionarios]);

  const presentes = funcionarios.filter(
    (funcionario) =>
      funcionario.status === "PRESENTE"
  ).length;

  const atrasados = funcionarios.filter(
    (funcionario) =>
      funcionario.status === "ATRASADO"
  ).length;

  const ausentes = funcionarios.filter(
    (funcionario) =>
      funcionario.status === "AUSENTE"
  ).length;

  function limparFormulario() {
    setNome("");
    setUsuario("");
    setTelefone("");
    setMatricula("");
    setSenha("");
    setHorarioEntrada("08:00");
    setHorarioSaida("17:00");
  }

  function formatarHora(
    dataHora?: string | null
  ): string {
    if (!dataHora) {
      return "--:--";
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(dataHora));
  }

  async function enviarCadastro(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (cadastrando) {
      return;
    }

    setCadastrando(true);
    setErro("");
    setMensagem("");

    try {
      const novoFuncionario =
        await cadastrarFuncionario({
          empresaId: empresa.id,
          nome: nome.trim(),
          usuario: usuario.trim(),
          telefone: telefone.trim(),
          matricula: matricula.trim(),
          senha,
          horarioEntrada,
          horarioSaida,
        });

      setFuncionarios((atuais) => [
        novoFuncionario,
        ...atuais,
      ]);

      setMensagem(
        "Funcionário cadastrado com sucesso."
      );

      limparFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o funcionário."
      );
    } finally {
      setCadastrando(false);
    }
  }

  async function removerFuncionario(
    funcionario: Funcionario
  ) {
    const confirmar = window.confirm(
      `Deseja excluir o funcionário ${funcionario.nome}?`
    );

    if (!confirmar) {
      return;
    }

    setFuncionarioExcluindo(funcionario.id);
    setErro("");
    setMensagem("");

    try {
      await excluirFuncionario(
        funcionario.id
      );

      setFuncionarios((atuais) =>
        atuais.filter(
          (item) =>
            item.id !== funcionario.id
        )
      );

      setMensagem(
        "Funcionário excluído com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o funcionário."
      );
    } finally {
      setFuncionarioExcluindo(null);
    }
  }

  async function analisar(
    justificativa: Justificativa,
    status: "APROVADA" | "RECUSADA"
  ) {
    try {
      const atualizada =
        await analisarJustificativa(
          justificativa.id,
          {
            status,
          }
        );

      setJustificativas(
        (atuais) =>
          atuais.map((item) =>
            item.id === atualizada.id
              ? atualizada
              : item
          )
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível analisar a justificativa."
      );
    }
  }

  function nomeStatus(
    funcionario: Funcionario
  ) {
    if (
      funcionario.status === "PRESENTE"
    ) {
      return "Presente";
    }

    if (
      funcionario.status === "ATRASADO"
    ) {
      return "Atrasado";
    }

    if (
      funcionario.status === "AUSENTE"
    ) {
      return "Ausente";
    }

    return "Sem registro";
  }

  function alternarFormulario() {
    setMostrarFormulario(
      (estadoAtual) => !estadoAtual
    );

    setErro("");
    setMensagem("");
  }

  return (
    <section className="empresa-dashboard">
      <div className="empresa-welcome">
        <div>
          <span className="eyebrow">
            Painel administrativo
          </span>

          <h1>{empresa.nome}</h1>

          <p>
            Acompanhe funcionários, horários e
            registros de ponto.
          </p>
        </div>

        <button
          type="button"
          className="primary company-add-button"
          onClick={alternarFormulario}
        >
          <Plus size={18} />

          {mostrarFormulario
            ? "Fechar cadastro"
            : "Cadastrar funcionário"}
        </button>
      </div>

      <div className="company-stats">
        <article className="company-stat-card">
          <div className="company-stat-icon">
            <UserRound size={21} />
          </div>

          <div>
            <span>Funcionários</span>
            <strong>
              {funcionarios.length}
            </strong>
          </div>
        </article>

        <article className="company-stat-card">
          <div className="company-stat-icon">
            <UserCheck size={21} />
          </div>

          <div>
            <span>Presentes</span>
            <strong>{presentes}</strong>
          </div>
        </article>

        <article className="company-stat-card">
          <div className="company-stat-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Atrasados</span>
            <strong>{atrasados}</strong>
          </div>
        </article>

        <article className="company-stat-card">
          <div className="company-stat-icon">
            <UserX size={21} />
          </div>

          <div>
            <span>Ausentes</span>
            <strong>{ausentes}</strong>
          </div>
        </article>
      </div>

      {mensagem && (
        <div className="company-success">
          {mensagem}
        </div>
      )}

      {erro && !mostrarFormulario && (
        <div className="company-error">
          {erro}
        </div>
      )}

      {mostrarFormulario && (
        <section className="company-panel employee-form-panel">
          <div className="company-panel-title">
            <div>
              <span className="eyebrow">
                Novo colaborador
              </span>

              <h2>
                Cadastrar funcionário
              </h2>
            </div>

            <Building2 size={25} />
          </div>

          <form
            className="employee-form"
            onSubmit={(evento) => {
              void enviarCadastro(evento);
            }}
          >
            <label>
              Nome completo

              <input
                type="text"
                value={nome}
                onChange={(evento) =>
                  setNome(
                    evento.target.value
                  )
                }
                placeholder="Ex.: Maria da Silva"
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Nome de usuário

              <input
                type="text"
                value={usuario}
                onChange={(evento) =>
                  setUsuario(
                    evento.target.value
                  )
                }
                placeholder="Ex.: maria.silva"
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Telefone

              <input
                type="tel"
                value={telefone}
                onChange={(evento) =>
                  setTelefone(
                    evento.target.value
                  )
                }
                placeholder="(81) 99999-9999"
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Matrícula

              <input
                type="text"
                value={matricula}
                onChange={(evento) =>
                  setMatricula(
                    evento.target.value
                  )
                }
                placeholder="Ex.: FUNC001"
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Senha inicial

              <input
                type="password"
                value={senha}
                onChange={(evento) =>
                  setSenha(
                    evento.target.value
                  )
                }
                placeholder="Crie uma senha"
                minLength={8}
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Horário de entrada

              <input
                type="time"
                value={horarioEntrada}
                onChange={(evento) =>
                  setHorarioEntrada(
                    evento.target.value
                  )
                }
                disabled={cadastrando}
                required
              />
            </label>

            <label>
              Horário de saída

              <input
                type="time"
                value={horarioSaida}
                onChange={(evento) =>
                  setHorarioSaida(
                    evento.target.value
                  )
                }
                disabled={cadastrando}
                required
              />
            </label>

            {erro && (
              <p className="login-error employee-form-error">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="login-button employee-submit"
              disabled={cadastrando}
            >
              {cadastrando
                ? "Cadastrando..."
                : "Cadastrar funcionário"}
            </button>
          </form>
        </section>
      )}

      <section className="company-panel">
        <div className="company-panel-title">
          <div>
            <span className="eyebrow">
              Solicitações
            </span>

            <h2>
              Justificativas
            </h2>
          </div>

          <FileText size={25} />
        </div>

        {carregandoJustificativas ? (
          <div className="company-loading">
            Carregando justificativas...
          </div>
        ) : justificativas.length === 0 ? (
          <div className="employee-empty">
            <FileText size={35} />

            <strong>
              Nenhuma justificativa recebida
            </strong>
          </div>
        ) : (
          <div className="justification-list">
            {justificativas.map(
              (justificativa) => (
                <article
                  key={justificativa.id}
                  className="justification-card"
                >
                  <div className="justification-card-header">
                    <div>
                      <strong>
                        {justificativa.funcionarioNome ??
                          "Funcionário"}
                      </strong>

                      <p>
                        {
                          justificativa.descricao
                        }
                      </p>
                    </div>

                    <span
                      className={`justification-status justification-status-${justificativa.status.toLowerCase()}`}
                    >
                      {justificativa.status}
                    </span>
                  </div>

                  <p>
                    Tipo:{" "}
                    {justificativa.tipo}
                  </p>

                  <p>
                    Data:{" "}
                    {
                      justificativa.dataOcorrencia
                    }
                  </p>

                  {justificativa.anexoNome && (
                    <div className="justification-attachment">
                      <Paperclip size={16} />

                      <span>
                        {
                          justificativa.anexoNome
                        }
                      </span>
                    </div>
                  )}

                  {justificativa.status ===
                    "PENDENTE" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          void analisar(
                            justificativa,
                            "APROVADA"
                          );
                        }}
                      >
                        Aprovar
                      </button>

                      <button
                        type="button"
                        className="employee-delete"
                        onClick={() => {
                          void analisar(
                            justificativa,
                            "RECUSADA"
                          );
                        }}
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="company-panel">
        <div className="employee-list-header">
          <div>
            <span className="eyebrow">
              Equipe
            </span>

            <h2>
              Funcionários cadastrados
            </h2>
          </div>

          <div className="employee-search">
            <Search size={18} />

            <input
              type="text"
              value={busca}
              onChange={(evento) =>
                setBusca(
                  evento.target.value
                )
              }
              placeholder="Buscar nome ou matrícula"
              disabled={carregando}
            />
          </div>
        </div>

        {carregando ? (
          <div className="company-loading">
            Carregando funcionários...
          </div>
        ) : funcionariosFiltrados.length ===
          0 ? (
          <div className="employee-empty">
            <UserRound size={35} />

            <strong>
              Nenhum funcionário encontrado
            </strong>

            <p>
              {busca.trim()
                ? "Nenhum funcionário corresponde à pesquisa."
                : "Cadastre o primeiro funcionário da empresa."}
            </p>
          </div>
        ) : (
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Matrícula</th>
                  <th>Telefone</th>
                  <th>Horário previsto</th>
                  <th>Entrada</th>
                  <th>Início intervalo</th>
                  <th>Retorno</th>
                  <th>Saída</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {funcionariosFiltrados.map(
                  (funcionario) => {
                    const excluindo =
                      funcionarioExcluindo ===
                      funcionario.id;

                    return (
                      <tr
                        key={funcionario.id}
                      >
                        <td>
                          <div className="employee-identity">
                            <div className="employee-avatar">
                              {funcionario.nome
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  funcionario.nome
                                }
                              </strong>

                              <span>
                                @
                                {
                                  funcionario.usuario
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {
                            funcionario.matricula
                          }
                        </td>

                        <td>
                          <span className="employee-phone">
                            <Phone size={15} />

                            {
                              funcionario.telefone
                            }
                          </span>
                        </td>

                        <td>
                          {
                            funcionario.horarioEntrada
                          }{" "}
                          às{" "}
                          {
                            funcionario.horarioSaida
                          }
                        </td>

                        <td>
                          {formatarHora(
                            funcionario.entradaHoje
                          )}
                        </td>

                        <td>
                          {formatarHora(
                            funcionario.inicioIntervaloHoje
                          )}
                        </td>

                        <td>
                          {formatarHora(
                            funcionario.fimIntervaloHoje
                          )}
                        </td>

                        <td>
                          {formatarHora(
                            funcionario.saidaHoje
                          )}
                        </td>

                        <td>
                          <span
                            className={`employee-status status-${funcionario.status.toLowerCase()}`}
                          >
                            {nomeStatus(
                              funcionario
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="employee-delete"
                            onClick={() => {
                              void removerFuncionario(
                                funcionario
                              );
                            }}
                            title="Excluir funcionário"
                            disabled={
                              funcionarioExcluindo !==
                              null
                            }
                            aria-label={`Excluir ${funcionario.nome}`}
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                          {excluindo && (
                            <span
                              aria-live="polite"
                              style={{
                                display: "none",
                              }}
                            >
                              Excluindo funcionário
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}