const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');

// Setup logging
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'med-study-backend' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Invalid token attempt: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Activity logging function
const logActivity = (userId, action, resourceType = null, resourceId = null, details = null, req) => {
  const activityData = {
    user_id: userId,
    action: action,
    resource_type: resourceType,
    resource_id: resourceId,
    details: details ? JSON.stringify(details) : null,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  };

  db.run(
    `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [activityData.user_id, activityData.action, activityData.resource_type, 
     activityData.resource_id, activityData.details, activityData.ip_address, activityData.user_agent],
    (err) => {
      if (err) logger.error('Failed to log activity:', err);
    }
  );
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          logger.error('Registration error:', err);
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign(
          { id: this.lastID, username, email, role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        logActivity(this.lastID, 'user_registered', 'users', this.lastID, { username, email }, req);
        logger.info(`New user registered: ${username} (${email})`);

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, email, role: 'user' }
        });
      }
    );
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          logger.error('Login query error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }

        if (!user) {
          logger.warn(`Failed login attempt for username: ${username}`);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
          return res.status(401).json({ error: 'Account is deactivated' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          logger.warn(`Failed login attempt for user ID: ${user.id}`);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        logActivity(user.id, 'user_login', 'users', user.id, null, req);
        logger.info(`User logged in: ${user.username}`);

        res.json({
          message: 'Login successful',
          token,
          user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
          }
        });
      }
    );
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected user routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        logger.error('Profile fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      res.json(user);
    }
  );
});

// Get all cards for authenticated user
app.get('/api/cards', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        logger.error('Cards fetch error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Add a card for authenticated user
app.post('/api/cards', authenticateToken, (req, res) => {
  const { question, answer, difficulty, tags, reference, hint } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  db.run(
    `INSERT INTO cards (user_id, question, answer, difficulty, tags, reference, hint) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, question, answer, difficulty, 
     tags ? JSON.stringify(tags) : null, reference, hint],
    function (err) {
      if (err) {
        logger.error('Card creation error:', err);
        return res.status(500).json({ error: err.message });
      }

      logActivity(req.user.id, 'card_created', 'cards', this.lastID, { question }, req);
      res.json({ id: this.lastID, message: 'Card created successfully' });
    }
  );
});

// Update a card
app.put('/api/cards/:id', authenticateToken, (req, res) => {
  const { question, answer, difficulty, tags, reference, hint } = req.body;
  const cardId = req.params.id;

  db.run(
    `UPDATE cards 
     SET question = ?, answer = ?, difficulty = ?, tags = ?, reference = ?, hint = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [question, answer, difficulty, tags ? JSON.stringify(tags) : null, reference, hint, cardId, req.user.id],
    function (err) {
      if (err) {
        logger.error('Card update error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Card not found or access denied' });
      }

      logActivity(req.user.id, 'card_updated', 'cards', cardId, { question }, req);
      res.json({ message: 'Card updated successfully' });
    }
  );
});

// Delete a card
app.delete('/api/cards/:id', authenticateToken, (req, res) => {
  const cardId = req.params.id;

  db.run(
    'DELETE FROM cards WHERE id = ? AND user_id = ?',
    [cardId, req.user.id],
    function (err) {
      if (err) {
        logger.error('Card deletion error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Card not found or access denied' });
      }

      logActivity(req.user.id, 'card_deleted', 'cards', cardId, null, req);
      res.json({ message: 'Card deleted successfully' });
    }
  );
});

// Feedback routes
app.post('/api/feedback', authenticateToken, (req, res) => {
  const { question_id, rating, feedback_text, is_helpful } = req.body;

  if (!question_id) {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  db.run(
    `INSERT INTO question_feedback (question_id, user_id, rating, feedback_text, is_helpful) 
     VALUES (?, ?, ?, ?, ?)`,
    [question_id, req.user.id, rating, feedback_text, is_helpful],
    function (err) {
      if (err) {
        logger.error('Feedback creation error:', err);
        return res.status(500).json({ error: 'Failed to submit feedback' });
      }

      logActivity(req.user.id, 'feedback_submitted', 'question_feedback', this.lastID, { question_id, rating }, req);
      res.json({ id: this.lastID, message: 'Feedback submitted successfully' });
    }
  );
});

// Admin routes
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT id, username, email, role, is_active, created_at, 
     (SELECT COUNT(*) FROM cards WHERE user_id = users.id) as card_count,
     (SELECT COUNT(*) FROM generated_questions WHERE user_id = users.id) as question_count
     FROM users ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error('Admin users fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, (req, res) => {
  const queries = {
    total_users: 'SELECT COUNT(*) as count FROM users',
    active_users: 'SELECT COUNT(*) as count FROM users WHERE is_active = 1',
    total_cards: 'SELECT COUNT(*) as count FROM cards',
    total_questions: 'SELECT COUNT(*) as count FROM generated_questions',
    total_feedback: 'SELECT COUNT(*) as count FROM question_feedback'
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [], (err, row) => {
      if (err) {
        logger.error(`Admin analytics error for ${key}:`, err);
        results[key] = 0;
      } else {
        results[key] = row.count;
      }

      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Express server running on port ${PORT}`);
  console.log(`Express server running on port ${PORT}`);
});
