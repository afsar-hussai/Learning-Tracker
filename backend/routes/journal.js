const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const { search, limit = 50 } = req.query;
    let query = 'SELECT * FROM journal_entries';
    const params = [];
    if (search) {
      query += ' WHERE learned LIKE ? OR problems_faced LIKE ? OR wins LIKE ?';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ' ORDER BY date DESC LIMIT ?';
    params.push(parseInt(limit));
    const entries = db.prepare(query).all(...params);
    res.json(entries);
  });

  router.get('/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const entry = db.prepare('SELECT * FROM journal_entries WHERE date=?').get(today);
    res.json(entry || null);
  });

  router.post('/', (req, res) => {
    const { date, learned, problems_faced, wins, mood, energy, phase } = req.body;
    const existing = db.prepare('SELECT id FROM journal_entries WHERE date=?').get(date);
    if (existing) {
      db.prepare('UPDATE journal_entries SET learned=?, problems_faced=?, wins=?, mood=?, energy=?, phase=? WHERE date=?')
        .run(learned || '', problems_faced || '', wins || '', mood || 3, energy || 3, phase || '', date);
      res.json({ success: true, id: existing.id });
    } else {
      const result = db.prepare('INSERT INTO journal_entries (date, learned, problems_faced, wins, mood, energy, phase) VALUES (?,?,?,?,?,?,?)')
        .run(date, learned || '', problems_faced || '', wins || '', mood || 3, energy || 3, phase || '');
      res.json({ success: true, id: result.lastInsertRowid });
    }
  });

  router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM journal_entries WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  return router;
};
