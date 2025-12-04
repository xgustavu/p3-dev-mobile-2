# CRUD + Kanban App  
Aplicativo mobile desenvolvido em **React Native (Expo)** com backend em **Node.js / Express** e banco de dados **PostgreSQL**.  
O sistema implementa autenticação JWT, três níveis de usuário, CRUD completo de usuários e um quadro Kanban com criação e edição de cards.

---

# 📱 Funcionalidades do Aplicativo

## 👤 Autenticação de Usuário
- Login com JWT.
- Usuário admin padrão criado automaticamente:
  - **username:** `adm`
  - **senha:** `123`

## 👥 Tipos de Usuário
| Papel        | Permissões                                                                 |
|--------------|----------------------------------------------------------------------------|
| **Admin**     | Criar usuários, editar, desativar/ativar, visualizar todos, acessar Kanban |
| **Supervisor**| Visualizar usuários, desativar/ativar, editar cards                        |
| **User**      | Criar e editar cards no Kanban (única função)                              |

---

# 📦 Funcionalidades Principais

## 🔐 Controle de Acesso
- Middleware de autenticação valida token JWT.
- Middleware de autorização garante acesso por papel.

## 👥 CRUD de Usuários
- Criar usuário (Admin)
- Listar usuários (Admin e Supervisor)
- Editar usuário (Admin)
- Ativar/Desativar usuário (Supervisor / Admin)

## 🗂 Kanban
- Três colunas: **todo**, **doing**, **done**
- Criar cards (sempre iniciam em `todo`)
- Editar cards (todos os papéis podem editar)
- Alterar título, descrição e coluna
- Layout horizontal com scroll

---

# 🛠 Tecnologias Utilizadas

## Backend
- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- UUID

## Frontend
- React Native (Expo)
- Hooks (useState, useEffect)
- Component-Based Architecture
- Modal para edição de cards
- FlatList + ScrollView horizontal para o Kanban

---

# 🧩 Design Patterns Utilizados

### ✔ Middleware Pattern
Usado para autenticação/autorizações.

### ✔ Factory Pattern
Usado na criação de tokens e objetos de card/usuário.

### ✔ MVC Simplificado
Rotas → lógica → banco (separação de responsabilidades).

### ✔ Observer Pattern (React Hooks)
UI reage a mudanças de estado.

### ✔ Component-Based Architecture
Tela dividida em componentes reutilizáveis.

---

# 🗄 Banco de Dados (PostgreSQL)

### 📌 Tabela `users`
- id (UUID)
- username
- name
- role
- password (hash)
- active
- created_at

### 📌 Tabela `cards`
- id (UUID)
- title
- description
- column_name
- creator_id (FK)
- created_at

---

# ▶ Como Rodar o Projeto

## 🟦 1) Subir o Banco (Docker)
```
docker compose up -d
```

## 🟢 2) Rodar o Backend
```
cd server
npm install
npm start
```

## 🟣 3) Rodar o App (React Native)
```
cd client
npm install
npx expo start
```

---

# 🔗 Endpoints da API

## 🔐 Autenticação
### POST `/auth/login`

## 👥 Usuários
- GET `/users`
- POST `/users`
- PUT `/users/:id`
- PATCH `/users/:id/disable`
- PATCH `/users/:id/activate`

## 🗂 Cards
- GET `/kanban/cards`
- POST `/kanban/cards`
- PUT `/kanban/cards/:id`

---