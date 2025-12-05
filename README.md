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
**Objetivo:** Centralizar regras que precisam ser executadas antes das rotas, como autenticação e autorização.

**Motivo para usar:** Evita duplicação de código nas rotas e aplica segurança de forma padronizada.

**Trecho de código usado no projeto:**
```js// middleware de autenticação
async function authMiddleware(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try{
    const data = jwt.verify(token, SECRET);
    const q = await pool.query('SELECT id, username, name, role, active FROM users WHERE id = $1', [data.id]);
    if(q.rowCount === 0) return res.status(401).json({ error: 'Invalid user' });
    req.user = q.rows[0];
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### ✔ Factory Pattern
**Objetivo:** Criar objetos padronizados e encapsular lógica de construção.

**Motivo para usar:** Facilita manutenção, evita repetição e centraliza a forma como tokens e objetos são criados.

**Trecho de código usado no projeto:**
```js// factory para gerar token JWT
function generateToken(user){
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
}
```

---

### ✔ MVC Simplificado (Separação de responsabilidades)
**Objetivo:** Manter o backend organizado separando responsabilidades.

**Motivo para usar:** Facilita manutenção, testes e clareza — especialmente em APIs REST.

**Trecho de código usado no projeto:**
```js// rota (Controller)
app.post('/auth/login', async (req,res) => {
  const { username, password } = req.body;
  const q = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  ...
});

// camada de acesso a dados (Model)
await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
```

---

### ✔ Observer Pattern (React Hooks)
**Objetivo:** Atualizar a interface automaticamente quando o estado muda.

**Motivo para usar:** O Kanban reage a atualizações sem precisar recarregar a tela.

**Trecho de código usado no projeto:**
```js// React observa mudanças de estado
useEffect(() => {
  fetchCards();
}, [token]);
```

---

### ✔ Component-Based Architecture
**Objetivo:** Reutilizar partes da interface e manter código organizado.

**Motivo para usar:** Cada parte do app (colunas, cards, formulários) é isolada e fácil de manter.

**Trecho de código usado no projeto:**
```jsx
function ColumnSelector({ value, onChange }){
  return (
    <View style={{ marginVertical: 6 }}>
      <TouchableOpacity onPress={() => onChange('todo')}><Text>Todo</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onChange('doing')}><Text>Doing</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onChange('done')}><Text>Done</Text></TouchableOpacity>
    </View>
  );
}
```

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