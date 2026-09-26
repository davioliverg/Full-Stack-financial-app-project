# Controle Financeiro Pessoal

Aplicação full stack de controle financeiro pessoal, construída do zero como projeto de encerramento de estudos em desenvolvimento web. Permite que o usuário registre receitas e despesas, acompanhe seu saldo, filtre transações, e defina orçamentos por categoria com acompanhamento automático de progresso.

Projeto construído com foco em fundamentos sólidos: sem frameworks de estado externos, sem bibliotecas de UI prontas — só JavaScript, React e Node/Express puros, para demonstrar domínio real de cada camada da stack.

## Funcionalidades

- Cadastro e login de usuários, com senha criptografada (bcrypt) e autenticação via JWT
- Isolamento de dados: cada usuário só acessa suas próprias transações e orçamentos
- Cadastro, edição e exclusão de transações (receita ou despesa), com categoria, valor, data e descrição
- Resumo automático: total de receitas, total de despesas e saldo, calculado em tempo real (estado derivado, sem duplicar dados)
- Filtros combinados por tipo, categoria e período
- Orçamentos por categoria: o usuário define um limite de gastos por categoria, e o app calcula automaticamente quanto já foi gasto (cruzando com as transações existentes) e exibe o progresso
- Estados de carregamento (loading) durante requisições assíncronas
- Formatação monetária localizada (`Intl.NumberFormat`, padrão EUR/pt-PT)

## Stack técnica

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcrypt`, `cors`, `dotenv`

**Frontend:** React (Vite), Hooks (`useState`, `useEffect`), fetch API, CSS

Sem Redux, sem bibliotecas de gráficos ou UI kits — gerenciamento de estado feito com Hooks nativos do React (`useState` + lifting state up), o suficiente para o escopo da aplicação.

## Arquitetura

```
React (frontend, porta 5173)
        │
        │  fetch() + JWT no header Authorization
        ▼
Express API (backend, porta 4000)
        │
        │  Mongoose
        ▼
MongoDB (Atlas ou local)
```

O frontend nunca acessa o banco de dados diretamente — toda comunicação passa pela API REST do backend, que valida o token JWT em cada requisição protegida e garante que um usuário só manipule seus próprios dados.

## Modelos de dados

**User**
| Campo | Tipo | Descrição |
|---|---|---|
| name | String | nome do usuário |
| email | String | único, usado no login |
| passwordHash | String | senha criptografada com bcrypt (nunca em texto puro) |

**Transaction**
| Campo | Tipo | Descrição |
|---|---|---|
| user | ObjectId (ref User) | dono da transação |
| type | String | `income` ou `expense` |
| amount | Number | valor |
| category | String | categoria (ex: transporte, salário) |
| date | Date | data da transação |
| description | String | opcional |

**Budget**
| Campo | Tipo | Descrição |
|---|---|---|
| user | ObjectId (ref User) | dono do orçamento |
| category | String | categoria limitada |
| limit | Number | valor máximo definido |

> O valor já gasto em cada orçamento **não é salvo no banco** — é sempre recalculado no frontend a partir das transações existentes, evitando dados duplicados e desatualizados (estado derivado).

## Endpoints da API

| Método | Rota | Protegida? | Descrição |
|---|---|---|---|
| POST | `/register` | Não | Cria um novo usuário |
| POST | `/login` | Não | Autentica e retorna um token JWT |
| GET | `/transactions` | Sim | Lista as transações do usuário logado |
| POST | `/transactions` | Sim | Cria uma nova transação |
| PUT | `/transactions/:id` | Sim | Atualiza uma transação existente |
| DELETE | `/transactions/:id` | Sim | Remove uma transação |
| GET | `/budgets` | Sim | Lista os orçamentos do usuário logado |
| POST | `/budgets` | Sim | Cria um novo orçamento |

Rotas protegidas exigem o header `Authorization: Bearer <token>`.

## Como rodar o projeto localmente

### Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend` com:

```
MONGO_URI=sua_string_de_conexao_mongodb
JWT_SECRET=uma_chave_secreta_qualquer
```

```bash
node server.js
```

O servidor sobe em `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## Conceitos técnicos praticados

- REST API com Express: rotas, controllers, middleware de autenticação, códigos de status HTTP apropriados
- Modelagem de dados NoSQL com Mongoose, incluindo relacionamento lógico entre usuário e seus registros
- Autenticação stateless com JWT e hash de senha com bcrypt
- Isolamento de dados por usuário (autorização, não só autenticação)
- Variáveis de ambiente para segredos (nunca commitadas no repositório)
- React com Hooks: `useState`, `useEffect`, formulários controlados, listas com `key`, renderização condicional
- Lifting state up para compartilhar estado entre componentes
- Atualização imutável de arrays (`spread`, `.filter()`, `.map()`, `.reduce()`)
- Estado derivado (valores calculados a partir de outro estado, nunca duplicados)
- Tratamento de estados assíncronos: carregando, sucesso e erro
- CORS e comunicação entre frontend e backend em portas diferentes

## Melhorias futuras

- Gráficos de gastos por categoria e por mês
- Testes automatizados (Jest / Supertest)
- Documentação da API com Swagger/OpenAPI
- Deploy em produção (backend + frontend + banco)

## Autor

Davi — projeto desenvolvido como parte de estudos em desenvolvimento web full stack, com foco em preparação para vagas de desenvolvedor JavaScript júnior.
