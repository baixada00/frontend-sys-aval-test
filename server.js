const express = require('express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const pool = require('./data/database/db');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const fucDir = path.join(__dirname, 'data/fucs');

// assegura diretoria de FUCs existe
if (!fs.existsSync(fucDir)) {
  fs.mkdirSync(fucDir, { recursive: true });
}

const allowedOrigins = [
  'http://localhost:10000',
  'https://projeto-estagio-sys-fuc-aval.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Error handling middleware
const handleErrors = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get unloaded FUC files
app.get('/api/fucs/files/unloaded', async (req, res) => {
  try {
    const { rows: existingFUCs } = await pool.query('SELECT path FROM fucs');
    const existingPaths = existingFUCs.map(row => row.path);

    const files = fs.readdirSync(fucDir).filter(f => f.endsWith('.txt'));
    const notLoaded = files.filter(file => !existingPaths.includes(file));

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(notLoaded);
  } catch (err) {
    console.error('Error listing unloaded FUC files:', err);
    res.status(500).json({ error: 'Error listing files' });
  }
});

// Save FUC draft
app.post('/api/fucs/rascunho', [
  body('titulo').notEmpty().trim().withMessage('Título é obrigatório'),
  body('tipo').notEmpty().trim().withMessage('Tipo é obrigatório'),
  body('campos').isArray().withMessage('Campos devem ser um array'),
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório')
], validate, async (req, res) => {
  const { titulo, tipo, campos, conteudo } = req.body;

  console.log('Dados recebidos para rascunho:', { titulo, tipo, campos, conteudo });

  const importadoPor = req.headers['x-importado-por'] || 'admin';
  const path = `importado_txt_${importadoPor}_${Date.now()}.txt`;

  try {
    const { rows } = await pool.query(
      'INSERT INTO fucs (titulo, tipo, campos, conteudo, path, enabled) VALUES ($1, $2, $3, $4, $5, false) RETURNING *',
      [titulo, tipo, JSON.stringify(campos), conteudo, path]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar rascunho:', err.message, err.stack);
    res.status(500).json({ error: 'Erro ao salvar rascunho' });
  }
});

// Finalize FUC
app.post('/api/fucs/finalizar', [
  body('titulo').notEmpty().trim().withMessage('Título é obrigatório'),
  body('tipo').notEmpty().trim().withMessage('Tipo é obrigatório'),
  body('campos').isArray().withMessage('Campos devem ser um array'),
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório')
], validate, async (req, res) => {
  const { titulo, tipo, campos, conteudo } = req.body;

  try {
    console.log('Dados recebidos para finalizar:', { titulo, tipo, campos, conteudo });

    const { rows } = await pool.query(
      'INSERT INTO fucs (titulo, tipo, campos, conteudo, enabled) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [titulo, tipo, JSON.stringify(campos), conteudo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao finalizar FUC:', err.message, err.stack);
    res.status(500).json({ error: 'Erro ao finalizar FUC' });
  }
});

// Load FUC from file
app.post('/api/fucs/from-file', [
  body('filename').notEmpty().trim().matches(/\.txt$/).withMessage('Invalid filename')
], validate, async (req, res) => {
  const { filename } = req.body;
  const filePath = path.join(fucDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const conteudo = fs.readFileSync(filePath, 'utf-8');
    const titulo = filename.replace('.txt', '');

    const { rows } = await pool.query(
      'INSERT INTO fucs (titulo, conteudo, path, enabled) VALUES ($1, $2, $3, false) RETURNING *',
      [titulo, conteudo, filename]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error inserting FUC:', err);
    res.status(500).json({ error: 'Error inserting FUC' });
  }
});

// Get specific FUC
app.get('/api/fucs/:id', [
  param('id').isInt().withMessage('ID must be an integer')
], validate, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM fucs WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'FUC não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar FUC:', err);
    res.status(500).json({ error: 'Erro ao buscar FUC' });
  }
});

// Update FUC content
app.put('/api/fucs/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório')
], validate, async (req, res) => {
  const { id } = req.params;
  const { conteudo } = req.body;
  
  try {
    const { rows } = await pool.query(
      'UPDATE fucs SET conteudo = $1 WHERE id = $2 RETURNING *',
      [conteudo, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'FUC não encontrada' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar FUC:', err);
    res.status(500).json({ error: 'Erro ao atualizar FUC' });
  }
});

// Get all FUCs
app.get('/api/fucs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM fucs ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao pesquisar FUCs:', err);
    res.status(500).json({ error: 'Erro ao pesquisar FUCs na BD' });
  }
});

// Update FUC status
app.patch('/api/fucs/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('enabled').isBoolean().withMessage('enabled must be a boolean')
], validate, async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE fucs SET enabled = $1 WHERE id = $2 RETURNING *',
      [enabled, id]
    );
    if (!rowCount) {
      return res.status(404).json({ error: 'FUC não encontrada' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao atualizar status da FUC:', err);
    res.status(500).json({ error: 'Erro ao atualizar status da FUC' });
  }
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const { rows: fucs } = await pool.query(`
      SELECT f.*, 
        COUNT(DISTINCT CASE WHEN a.respostas ? 'estado' AND a.respostas->>'estado' = 'submetido' THEN a.id END) as avaliacoes_count
      FROM fucs f
      LEFT JOIN avaliacoes a ON f.id = a.fuc_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);

    res.json({
      titulo: "Sistema de Avaliação de FUCs",
      fucs: fucs.map(fuc => ({
        id: fuc.id,
        nome: fuc.titulo,
        link: `/avaliacao-fuc/${fuc.id}`,
        submetidos: parseInt(fuc.avaliacoes_count) || 0,
        enabled: fuc.enabled
      }))
    });
  } catch (err) {
    console.error('Erro ao buscar dados do dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

// Templates CRUD
app.get('/api/templates', async (req, res) => {
  try {
    const { fuc_id } = req.query;
    let query = `
      SELECT t.*, u.username as criador_nome 
      FROM templates t 
      LEFT JOIN users u ON t.criado_por = u.id
    `;
    let params = [];

    if (fuc_id) {
      query += ' WHERE t.fuc_id = $1';
      params.push(fuc_id);
    }

    query += ' ORDER BY t.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao pesquisar templates:', err);
    res.status(500).json({ error: 'Erro ao pesquisar templates' });
  }
});

app.post('/api/templates', [
  body('nome').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório'),
  body('fuc_id').isInt().withMessage('FUC ID deve ser um número'),
  body('criado_por').isInt().withMessage('Criador ID deve ser um número')
], validate, async (req, res) => {
  const { nome, conteudo, fuc_id, criado_por } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO templates (nome, conteudo, fuc_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, JSON.stringify(conteudo), fuc_id, criado_por]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar template:', err);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

app.put('/api/templates/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('nome').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('conteudo').notEmpty().withMessage('Conteúdo é obrigatório')
], validate, async (req, res) => {
  const { id } = req.params;
  const { nome, conteudo } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE templates SET nome = $1, conteudo = $2 WHERE id = $3 RETURNING *',
      [nome, JSON.stringify(conteudo), id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar template:', err);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

app.get('/api/templates/:id', [
  param('id').isInt().withMessage('ID must be an integer')
], validate, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.username as criador_nome 
      FROM templates t 
      LEFT JOIN users u ON t.criado_por = u.id 
      WHERE t.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao pesquisar template:', err);
    res.status(500).json({ error: 'Erro ao pesquisar template' });
  }
});

// Users endpoints
app.post('/api/users', [
  body('username').notEmpty().trim().withMessage('Username é obrigatório'),
  body('roles').isArray({ min: 1 }).withMessage('Pelo menos um role deve ser fornecido'),
  body('roles.*').isIn(['admin', 'gestor', 'avaliador']).withMessage('Role inválido')
], validate, async (req, res) => {
  const { username, roles } = req.body;

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username) VALUES ($1) RETURNING id, username, created_at',
      [username]
    );
    const user = rows[0];

    for (const role of roles) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [user.id, role]
      );
    }

    res.status(201).json({ ...user, roles });
  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username já existe.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar utilizador' });
    }
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { rows: users } = await pool.query('SELECT id, username, created_at FROM users ORDER BY username');
    for (const user of users) {
      const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
      user.roles = rolesRes.rows.map(r => r.role);
    }
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar utilizadores:', err);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

app.patch('/api/users/:id', [
  param('id').isInt().withMessage('ID inválido'),
  body('roles').isArray({ min: 1 }).withMessage('Pelo menos um role deve ser fornecido'),
  body('roles.*').isIn(['admin', 'gestor', 'avaliador']).withMessage('Role inválido')
], validate, async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;

  try {
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    for (const role of roles) {
      await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [id, role]);
    }

    res.json({ message: 'Papéis atualizados com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar papéis do utilizador' });
  }
});

app.delete('/api/users/:id', [
  param('id').isInt().withMessage('ID inválido')
], validate, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar utilizador' });
  }
});

app.post('/api/users/verify', [
  body('username').notEmpty().trim().withMessage('Username é obrigatório')
], validate, async (req, res) => {
  const { username } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const user = userResult.rows[0];

    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id]
    );

    const roles = rolesResult.rows.map(r => r.role);

    res.json({ ...user, roles });
  } catch (err) {
    console.error('Erro ao verificar utilizador:', err);
    res.status(500).json({ error: 'Erro interno ao verificar utilizador' });
  }
});

app.post('/api/users/verify-role', [
  body('username').notEmpty().trim().withMessage('Username é obrigatório'),
  body('role').isIn(['admin', 'gestor', 'avaliador']).withMessage('Cargo inválido')
], validate, async (req, res) => {
  const { username, role } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const userId = userResult.rows[0].id;

    const roleCheck = await pool.query(
      'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
      [userId, role]
    );

    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Utilizador não tem este cargo' });
    }

    res.json({ userId, username, role });
  } catch (err) {
    console.error('Erro ao verificar cargo do utilizador:', err);
    res.status(500).json({ error: 'Erro interno ao verificar cargo' });
  }
});

// Enhanced Evaluation endpoints
app.get('/api/avaliacoes/rascunhos/:userId', [
  param('userId').isInt().withMessage('User ID must be an integer')
], validate, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { rows } = await pool.query(`
      SELECT 
        a.id,
        a.fuc_id,
        a.template_id,
        a.created_at,
        f.titulo as fuc_nome,
        t.nome as template_nome
      FROM avaliacoes a
      JOIN fucs f ON a.fuc_id = f.id
      LEFT JOIN templates t ON a.template_id = t.id
      WHERE a.avaliador_id = $1 
      AND (a.respostas->>'estado' = 'rascunho' OR a.respostas->>'estado' IS NULL)
      ORDER BY a.created_at DESC
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar rascunhos:', error);
    res.status(500).json({ error: 'Erro ao buscar rascunhos' });
  }
});

app.get('/api/avaliacoes/:id', [
  param('id').isInt().withMessage('ID must be an integer')
], validate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { rows } = await pool.query('SELECT * FROM avaliacoes WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliação' });
  }
});

app.put('/api/avaliacoes/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('respostas').isObject().withMessage('Respostas devem ser um objeto')
], validate, async (req, res) => {
  const { id } = req.params;
  const { respostas } = req.body;
  
  try {
    const { rows } = await pool.query(
      'UPDATE avaliacoes SET respostas = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(respostas), id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// Enhanced Reports endpoints
app.get('/api/relatorios', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.fuc_id,
        f.titulo as fuc_titulo,
        u.username AS avaliador,
        CASE 
          WHEN a.respostas ? 'estado' AND a.respostas->>'estado' = 'submetido' THEN 'submetido'
          ELSE 'gravado'
        END AS status,
        a.created_at AS data,
        COALESCE(a.respostas->>'comentario', '') AS comentario,
        a.respostas
      FROM avaliacoes a
      LEFT JOIN users u ON u.id = a.avaliador_id
      LEFT JOIN fucs f ON f.id = a.fuc_id
      ORDER BY a.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios" });
  }
});

app.get('/api/relatorios/:fucId', async (req, res) => {
  const { fucId } = req.params;

  try {
    const query = `
      SELECT 
        a.id,
        a.fuc_id,
        f.titulo as fuc_titulo,
        u.username AS avaliador,
        CASE 
          WHEN a.respostas ? 'estado' AND a.respostas->>'estado' = 'submetido' THEN 'submetido'
          ELSE 'gravado'
        END AS status,
        a.created_at AS data,
        COALESCE(a.respostas->>'comentario', '') AS comentario,
        a.respostas
      FROM avaliacoes a
      LEFT JOIN users u ON u.id = a.avaliador_id
      LEFT JOIN fucs f ON f.id = a.fuc_id
      WHERE a.fuc_id = $1
      ORDER BY a.created_at DESC
    `;
    const { rows } = await pool.query(query, [fucId]);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar relatórios da FUC:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios da FUC" });
  }
});

app.post('/api/avaliacoes/gravar', [
  body('fuc_id').isInt().withMessage('FUC ID deve ser um número'),
  body('avaliador_id').isInt().withMessage('Avaliador ID deve ser um número'),
  body('respostas').isObject().withMessage('Respostas devem ser um objeto')
], validate, async (req, res) => {
  const { fuc_id, avaliador_id, template_id, respostas } = req.body;

  try {
    const existingEvaluation = await pool.query(
      'SELECT id FROM avaliacoes WHERE fuc_id = $1 AND avaliador_id = $2 AND template_id = $3',
      [fuc_id, avaliador_id, template_id]
    );

    if (existingEvaluation.rows.length > 0) {
      const { rows } = await pool.query(
        'UPDATE avaliacoes SET respostas = $1 WHERE fuc_id = $2 AND avaliador_id = $3 AND template_id = $4 RETURNING *',
        [JSON.stringify(respostas), fuc_id, avaliador_id, template_id]
      );
      res.json(rows[0]);
    } else {
      const { rows } = await pool.query(
        'INSERT INTO avaliacoes (fuc_id, avaliador_id, template_id, respostas) VALUES ($1, $2, $3, $4) RETURNING *',
        [fuc_id, avaliador_id, template_id, JSON.stringify(respostas)]
      );
      res.status(201).json(rows[0]);
    }
  } catch (error) {
    console.error("Erro ao gravar avaliação:", error);
    res.status(500).json({ error: "Erro ao gravar avaliação" });
  }
});

app.post('/api/avaliacoes/submeter', [
  body('id').isInt().withMessage('ID deve ser um número'),
  body('comentario').optional().isString().trim().withMessage('Comentário deve ser uma string')
], validate, async (req, res) => {
  const { id, comentario } = req.body;

  try {
    const { rowCount } = await pool.query(
      'UPDATE avaliacoes SET respostas = respostas || $1 WHERE id = $2',
      [JSON.stringify({ estado: 'submetido', comentario }), id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao submeter avaliação:", error);
    res.status(500).json({ error: "Erro ao submeter avaliação" });
  }
});

app.delete('/api/relatorios/:id', [
  param('id').isInt().withMessage('ID deve ser um número')
], validate, async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query('DELETE FROM avaliacoes WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao apagar relatório:", error);
    res.status(500).json({ error: "Erro ao apagar relatório" });
  }
});

app.use(handleErrors);

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});