# Nexus Ponto — MVP

Primeira versão funcional do aplicativo de ponto.

## Recursos incluídos

- Alternância entre visão do funcionário e da empresa
- Registro sequencial de entrada, intervalo, retorno e saída
- Horário obtido pelo navegador
- Histórico diário
- Identificação simples de atraso na entrada após 08:05
- Notificação do funcionário ao registrar
- Painel da empresa atualizado em tempo real entre abas
- Notificações do navegador e lembrete periódico de demonstração
- Persistência local com localStorage

## Como executar no Windows

1. Instale o Node.js.
2. Extraia esta pasta.
3. Abra o terminal dentro da pasta.
4. Execute:

```bash
npm install
npm run dev
```

5. Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.

## Como testar a notificação da empresa

1. Abra o aplicativo em duas abas.
2. Na primeira aba, selecione **Funcionário**.
3. Na segunda, selecione **Empresa**.
4. Ative as notificações nas duas abas.
5. Registre um ponto na aba do funcionário.
6. O painel da empresa será atualizado automaticamente.

## Próxima etapa

Substituir o armazenamento local por backend Java Spring Boot e PostgreSQL, adicionar login, empresas, funcionários e notificações push reais.
