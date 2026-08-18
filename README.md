# 🕒 Nexus Ponto — MVP

> Primeira versão funcional do aplicativo web para registro e controle de ponto eletrônico em tempo real.

---

## 📌 Sobre o Projeto

O **Nexus Ponto** é uma solução leve e moderna desenvolvida para simplificar a jornada de registro de ponto de funcionários e o acompanhamento por parte da empresa. 

Nesta versão inicial (**MVP**), a aplicação opera inteiramente no navegador utilizando **persistência local (`localStorage`)** e **sincronização reativa entre abas**, permitindo testar o fluxo de ponta a ponta sem a necessidade imediata de um banco de dados externo.

---

## ✨ Recursos Incluídos

* **👥 Visão Dupla:** Alternância simplificada entre o perfil do **Funcionário** e a gestão da **Empresa**.
* **⏱️ Marcação Sequencial:** Controle do fluxo obrigatório de batidas (*Entrada* ➔ *Intervalo* ➔ *Retorno* ➔ *Saída*).
* **⚠️ Detecção Automática de Atrasos:** Identificação visual imediata de atrasos para entradas registradas após as **08:05**.
* **⚡ Dashboard em Tempo Real:** O painel da empresa reflete novos registros de ponto instantaneamente entre abas abertas no navegador.
* **🔔 Notificações Nativas:** Suporte a notificações de navegador no registro e lembretes periódicos de demonstração.
* **💾 Persistência Local:** Histórico diário salvo via `localStorage`.

---

## 🛠️ Tecnologias Utilizadas

* **Runtime & Tooling:** [Node.js](https://nodejs.org/) & [Vite](https://vitejs.dev/)
* **Linguagem & Interface:** HTML5, CSS3, JavaScript / Web APIs
* **Web APIs Nativas:**
  * `localStorage` — Persistência local de dados
  * `StorageEvent` — Comunicação e sincronização reativa entre abas
  * `Notification API` — Emissão de notificações no sistema operacional

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

Certifique-se de ter o **[Node.js](https://nodejs.org/)** instalado em sua máquina.

### Passo a Passo

1. **Clone ou extraia** o projeto em sua máquina:
   ```bash
   git clone [https://github.com/seu-usuario/nexus-ponto.git](https://github.com/seu-usuario/nexus-ponto.git)
   cd nexus-ponto


Instale as dependências:

Bash
npm install

Inicie o servidor de desenvolvimento:

Bash
npm run dev

Acesse no navegador:
Abra o endereço indicado no terminal (habitualmente http://localhost:5173).

🧪 Como Testar a Sincronização em Tempo Real
Abra o aplicativo em duas abas distintas do mesmo navegador.

Na Aba 1, selecione o perfil Funcionário e ative as notificações.

Na Aba 2, selecione o perfil Empresa e ative as notificações.

Registre um ponto na Aba 1.

Observe o painel da Aba 2 atualizar automaticamente em tempo real!

🎯 Próximos Passos (Roadmap)
Nas próximas etapas de desenvolvimento do Nexus Ponto, o projeto receberá uma evolução completa de arquitetura:

[ ] Backend Robust: Implementação de API REST com Java Spring Boot.

[ ] Banco de Dados Relacional: Substituição do localStorage pelo PostgreSQL.

[ ] Gestão de Acesso: Autenticação segura (JWT) para usuários, empresas e funcionários.

[ ] Push Notifications: Alertas ativos enviados diretamente pelo servidor em tempo real
