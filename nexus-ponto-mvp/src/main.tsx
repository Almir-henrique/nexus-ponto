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
