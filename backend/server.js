const express = require('express');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a card
app.post('/api/cards', (req, res) => {
  const { user_id, question, answer } = req.body;
  db.run(
    'INSERT INTO cards (user_id, question, answer) VALUES (?, ?, ?)',
    [user_id, question, answer],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
