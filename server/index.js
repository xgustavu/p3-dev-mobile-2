const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'very_secret_jwt_key_change_this_in_prod';
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'crud_kanban'
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

async function migrate() {
  // create tables if not exists
  await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    column_name TEXT DEFAULT 'todo',
    creator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
  );
  `);
  console.log('Migrations applied');
}

async function ensureAdmin() {
  const res = await pool.query('SELECT id FROM users WHERE username = $1', ['adm']);
  if(res.rowCount === 0){
    const id = uuidv4();
    const hashed = bcrypt.hashSync('123', 8);
    await pool.query('INSERT INTO users(id, username, name, role, active, password) VALUES($1,$2,$3,$4,$5,$6)', [id,'adm','Administrador','admin',true,hashed]);
    console.log('Admin user created -> username: adm password: 123');
  } else {
    console.log('Admin already exists');
  }
}

function generateToken(user){
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
}

async function authMiddleware(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try{
    const data = jwt.verify(token, SECRET);
    const q = await pool.query('SELECT id, username, name, role, active FROM users WHERE id = $1', [data.id]);
    if(q.rowCount === 0) return res.status(401).json({ error: 'Invalid user' });
    const user = q.rows[0];
    if(!user.active) return res.status(401).json({ error: 'User disabled' });
    req.user = user;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles){
  return (req,res,next) => {
    if(!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if(!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  }
}

// Auth
app.post('/auth/login', async (req,res) => {
  const { username, password } = req.body;
  const q = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if(q.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
  const user = q.rows[0];
  const ok = bcrypt.compareSync(password, user.password);
  if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
  if(!user.active) return res.status(403).json({ error: 'User disabled' });
  const token = generateToken(user);
  const safe = { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active };
  res.json({ user: safe, token });
});

// Users CRUD - admin only for list/create/update
app.get('/users', authMiddleware, requireRole('admin','supervisor'), async (req,res) => {
  const q = await pool.query('SELECT id, username, name, role, active, created_at FROM users ORDER BY created_at DESC');
  res.json(q.rows);
});

app.post('/users', authMiddleware, requireRole('admin'), async (req,res) => {
  const { username, name, role, password } = req.body;
  const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if(exists.rowCount) return res.status(400).json({ error: 'Username already exists' });
  const id = uuidv4();
  const hashed = bcrypt.hashSync(password || '123', 8);
  await pool.query('INSERT INTO users(id, username, name, role, active, password) VALUES($1,$2,$3,$4,$5,$6)', [id,username,name,role || 'user',true,hashed]);
  const s = await pool.query('SELECT id, username, name, role, active FROM users WHERE id = $1', [id]);
  res.json(s.rows[0]);
});

app.put('/users/:id', authMiddleware, requireRole('admin'), async (req,res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  const q = await pool.query('UPDATE users SET name = COALESCE($1,name), role = COALESCE($2,role) WHERE id = $3 RETURNING id, username, name, role, active', [name, role, id]);
  if(q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(q.rows[0]);
});

// Supervisor can disable users
app.patch('/users/:id/disable', authMiddleware, requireRole('supervisor','admin'), async (req,res) => {
  const { id } = req.params;
  const q = await pool.query('UPDATE users SET active = false WHERE id = $1 RETURNING id, username, name, role, active', [id]);
  if(q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(q.rows[0]);
});

app.patch('/users/:id/activate', authMiddleware, requireRole('supervisor','admin'), async (req,res) => {
  const { id } = req.params;
  const q = await pool.query('UPDATE users SET active = true WHERE id = $1 RETURNING id, username, name, role, active', [id]);
  if(q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(q.rows[0]);
});

// Kanban cards
app.get('/kanban/cards', authMiddleware, async (req,res) => {
  // map column_name -> column for compatibility with client
  const q = await pool.query('SELECT id, title, description, column_name AS column, creator_id, created_at FROM cards ORDER BY created_at DESC');
  res.json(q.rows);
});

app.post('/kanban/cards', authMiddleware, async (req,res) => {
  if(!['admin','supervisor','user'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { title, description, column } = req.body;
  const id = uuidv4();
  await pool.query('INSERT INTO cards(id, title, description, column_name, creator_id) VALUES($1,$2,$3,$4,$5)', [id, title, description || '', column || 'todo', req.user.id]);
  const q = await pool.query('SELECT id, title, description, column_name AS column, creator_id, created_at FROM cards WHERE id = $1', [id]);
  res.json(q.rows[0]);
});

app.put('/kanban/cards/:id', authMiddleware, async (req,res) => {
  const { id } = req.params;
  const cardQ = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
  if(cardQ.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  // allow admin, supervisor and regular users to edit cards
  if(!['admin','supervisor','user'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { title, description, column } = req.body;
  const upd = await pool.query('UPDATE cards SET title = COALESCE($1,title), description = COALESCE($2,description), column_name = COALESCE($3,column_name) WHERE id = $4 RETURNING id, title, description, column_name AS column, creator_id, created_at', [title, description, column, id]);
  res.json(upd.rows[0]);
});

const PORT = process.env.PORT || 4000;
migrate().then(ensureAdmin).then(() => {
  app.listen(PORT, () => {
    console.log('Server running on port', PORT);
  });
}).catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});