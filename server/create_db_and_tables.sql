-- Create database and tables (if you prefer to create DB manually)
-- Connect as the postgres superuser (from host where postgres is accessible):
-- psql -h localhost -U postgres -c "CREATE DATABASE crud_kanban;"

-- Tables are created automatically by the server migration, but here are SQL statements if you prefer:
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
  column TEXT DEFAULT 'todo',
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);