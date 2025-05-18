const express = require('express');
const cors = require('cors');
const pool = require('./data/database/db');

const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  'http://localhost:10000',
  'https://projeto-estagio-sys-fuc-aval-mjff-l64x3mm0d.vercel.app',
  'https://projeto-estagio-sys-fuc-aval.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Get specific FUC
app.get('/api/fucs/:id', async (req, res) => {
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
app.patch('/api/fucs/:id', async (req, res) => {
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
        COUNT(DISTINCT CASE WHEN a.respostas IS NOT NULL THEN a.id END) as avaliacoes_count
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
    const { rows } = await pool.query(`
      SELECT t.*, u.username as criador_nome 
      FROM templates t 
      LEFT JOIN users u ON t.criado_por = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar templates:', err);
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

app.post('/api/templates', async (req, res) => {
  const { nome, conteudo, fuc_id, criado_por } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO templates (nome, conteudo, fuc_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, conteudo, fuc_id, criado_por]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar template:', err);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, conteudo } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE templates SET nome = $1, conteudo = $2 WHERE id = $3 RETURNING *',
      [nome, conteudo, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar template:', err);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.username as criador_nome 
      FROM templates t 
      LEFT JOIN users u ON t.criado_por = u.id 
      WHERE t.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar template:', err);
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
});

// Avaliações
app.get('/api/avaliacoes/:fucId', async (req, res) => {
  const { fucId } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT a.*, u.username as avaliador_nome, t.nome as template_nome
      FROM avaliacoes a
      LEFT JOIN users u ON a.avaliador_id = u.id
      LEFT JOIN templates t ON a.template_id = t.id
      WHERE a.fuc_id = $1
      ORDER BY a.created_at DESC
    `, [fucId]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

app.post('/api/avaliacoes', async (req, res) => {
  const { template_id, fuc_id, avaliador_id, respostas } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO avaliacoes (template_id, fuc_id, avaliador_id, respostas) VALUES ($1, $2, $3, $4) RETURNING *',
      [template_id, fuc_id, avaliador_id, respostas]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Permissões
app.get('/api/fuc-permissions/:gestorId', async (req, res) => {
  const { gestorId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT f.* FROM fucs f INNER JOIN fuc_permissions p ON f.id = p.fuc_id WHERE p.gestor_id = $1',
      [gestorId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar permissões:', err);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

app.post('/api/fuc-permissions', async (req, res) => {
  const { gestor_id, fuc_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO fuc_permissions (gestor_id, fuc_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [gestor_id, fuc_id]
    );
    res.status(201).json({ message: 'Permissão adicionada com sucesso' });
  } catch (err) {
    console.error('Erro ao adicionar permissão:', err);
    res.status(500).json({ error: 'Erro ao adicionar permissão' });
  }
});

app.delete('/api/fuc-permissions', async (req, res) => {
  const { gestor_id, fuc_id } = req.body;
  try {
    await pool.query(
      'DELETE FROM fuc_permissions WHERE gestor_id = $1 AND fuc_id = $2',
      [gestor_id, fuc_id]
    );
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover permissão:', err);
    res.status(500).json({ error: 'Erro ao remover permissão' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});