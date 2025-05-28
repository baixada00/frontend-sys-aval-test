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

// Modified user verification endpoint
app.post('/api/users/verify', [
  body('username').notEmpty().trim().withMessage('Username é obrigatório'),
], validate, async (req, res) => {
  const { username } = req.body;

  try {
    // Get user and their roles
    const userQuery = await pool.query(
      `SELECT u.id, u.username, array_agg(ur.role) as roles 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.username = $1 
       GROUP BY u.id, u.username`,
      [username]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userQuery.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      roles: user.roles
    });
  } catch (err) {
    console.error('Erro ao verificar usuário:', err);
    res.status(500).json({ error: 'Erro interno ao verificar usuário' });
  }
});

// New endpoint to get user roles
app.get('/api/users/roles/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT array_agg(ur.role) as roles 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.username = $1 
       GROUP BY u.id`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ roles: result.rows[0].roles });
  } catch (err) {
    console.error('Erro ao buscar roles:', err);
    res.status(500).json({ error: 'Erro ao buscar roles do usuário' });
  }
});

// Modified user creation endpoint
app.post('/api/users', [
  body('username').notEmpty().trim().withMessage('Username é obrigatório'),
  body('roles').isArray().withMessage('Roles deve ser um array')
], validate, async (req, res) => {
  const { username, roles } = req.body;

  try {
    await pool.query('BEGIN');

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (username) VALUES ($1) RETURNING id',
      [username]
    );
    
    const userId = userResult.rows[0].id;

    // Insert roles
    for (const role of roles) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [userId, role]
      );
    }

    await pool.query('COMMIT');

    res.status(201).json({
      id: userId,
      username,
      roles
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Erro ao criar usuário:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username já existe.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
});

// Modified user role update endpoint
app.patch('/api/users/:id/roles', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('roles').isArray().withMessage('Roles deve ser um array')
], validate, async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;

  try {
    await pool.query('BEGIN');

    // Remove existing roles
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    // Add new roles
    for (const role of roles) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [id, role]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: 'Roles atualizadas com sucesso' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar roles' });
  }
});

// Rest of your existing endpoints...
[Previous code continues unchanged...]