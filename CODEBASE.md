# 🗺️ Mapa da Base de Código (Codebase Map)

Este documento foi criado para ajudar desenvolvedores e assistentes de IA a navegarem de forma rápida e eficiente pelo projeto, evitando dúvidas sobre a localização e responsabilidade de cada arquivo.

---

## 📁 Estrutura de Diretórios Principal

```plaintext
brn-suite-escolas/
├── database/                # Scripts SQL e migrações do banco de dados (Supabase)
├── docs/                    # Documentação detalhada sobre regras de negócio e arquitetura
├── public/                  # Arquivos estáticos (imagens, ícones, arquivos públicos)
├── src/                     # Código-fonte da aplicação
│   ├── components/          # Componentes React reutilizáveis e layouts
│   ├── context/             # Provedores de estado global (Context API)
│   ├── hooks/               # Hooks customizados para abstração de chamadas à API e lógica
│   ├── lib/                 # Configurações e clientes de serviços externos (Supabase, etc)
│   ├── pages/               # Páginas completas da aplicação (mapeadas nas rotas)
│   ├── types/               # Definições de tipos TypeScript
│   ├── App.tsx              # Componente raiz
│   ├── index.css            # Folha de estilos global (Tailwind CSS)
│   ├── main.tsx             # Ponto de entrada do React
│   └── routes.tsx           # Configuração de rotas da aplicação (React Router)
├── vercel.json              # Configurações de deploy da Vercel (Redirecionamentos, Headers e CSP)
└── package.json             # Dependências e scripts do projeto
```

---

## 📄 Páginas do Sistema (`src/pages/`)

| Arquivo | Finalidade | Nível de Acesso |
|---------|------------|-----------------|
| [LandingPage.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/LandingPage.tsx) | Página inicial pública com apresentação dos planos do sistema. | Público |
| [Login.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Login.tsx) | Portal de autenticação do usuário. | Público |
| [Dashboard.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Dashboard.tsx) | Painel com gráficos, resumos financeiros, alertas e saldos da escola. | Autenticado |
| [FinancialEntries.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/FinancialEntries.tsx) | Gestão completa de lançamentos de entradas e saídas (Adicionar, Editar, Excluir). | Autenticado |
| [Reports.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Reports.tsx) | Geração guiada de documentos de Prestação de Contas (Atas, Cotações, etc). | Autenticado |
| [DocumentSafe.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/DocumentSafe.tsx) | Cofre digital para upload e armazenamento de certidões, notas e extratos. | Admin, Operador, Técnico |
| [BankReconciliation.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/BankReconciliation.tsx) | Conciliação bancária entre os lançamentos do sistema e extratos em PDF/OFX. | Admin, Operador, Técnico |
| [Contract.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Contract.tsx) | Tela de assinatura digital do Termo de Responsabilidade e Uso. | Diretor (Pendente) |
| [Notifications.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Notifications.tsx) | Histórico de alertas de saldo, vencimentos e auditorias. | Autenticado |
| [Schools.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Schools.tsx) | Gerenciamento de escolas (Cadastro, customização de planos e preços). | Admin, Operador, Técnico |
| [Users.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Users.tsx) | Controle de usuários do sistema, ativação de contas e atribuição de níveis de acesso (RBAC). | Admin |
| [Settings.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Settings.tsx) | Configuração de programas, rubricas, fornecedores e métodos de pagamento. | Autenticado |
| [GEE.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/GEE.tsx) | Gerenciamento dos grupos escolares (GEE) do Estado. | Admin, Operador |
| [Help.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/Help.tsx) | Central de ajuda, FAQ e abertura de chamados de suporte técnico. | Autenticado |
| [WaitingPage.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/WaitingPage.tsx) | Tela exibida quando a conta do usuário ainda não está ativa ou autorizada. | Autenticado |
| [ValidateReport.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/ValidateReport.tsx) | Página pública para validação de integridade dos relatórios gerados. | Público |
| [ProgramsGuide.tsx](file:///d:/PROJETOS/brn-suite-escolas/brn-suite-escolas/src/pages/ProgramsGuide.tsx) | Guia completo de programas educacionais e regras de execução. | Público |

---

## ⚡ Fluxos e Pontos Chave

### Autenticação e Controle de Assinatura
* A lógica que verifica se o usuário precisa ou não assinar o contrato digital antes de entrar no Dashboard está centralizada em `src/context/AuthContext.tsx` no método `checkContractSignature`.
* A página de assinatura em si é a `src/pages/Contract.tsx`.

### Conexão com o Banco de Dados
* Todas as consultas e operações utilizam o cliente unificado do Supabase instanciado em `src/lib/supabaseClient.ts`.
