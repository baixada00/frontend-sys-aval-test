-- ---- Schema de Usuários ----
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---- Schema de Roles de Usuário ----
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'gestor', 'avaliador')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- ---- Schema de FUCs ----
CREATE TABLE IF NOT EXISTS fucs (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    path TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT false,
    tipo TEXT,
    campos JSONB,
    conteudo TEXT,
    estado TEXT DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'finalizado'))
);

-- ---- Schema de Templates ----
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    conteudo JSONB NOT NULL,
    fuc_id INTEGER REFERENCES fucs(id) ON DELETE CASCADE,
    criado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---- Schema de Permissões de Gestores ----
CREATE TABLE IF NOT EXISTS fuc_permissions (
    id SERIAL PRIMARY KEY,
    gestor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fuc_id INTEGER REFERENCES fucs(id) ON DELETE CASCADE,
    UNIQUE(gestor_id, fuc_id)
);

-- ---- Schema de Avaliações ----
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    fuc_id INTEGER REFERENCES fucs(id) ON DELETE SET NULL,
    avaliador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    respostas JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);