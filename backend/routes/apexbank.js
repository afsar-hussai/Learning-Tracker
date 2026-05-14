const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Get all tasks grouped by layer
  router.get('/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM apex_tasks ORDER BY layer, id').all();
    res.json(tasks);
  });

  // Toggle task
  router.put('/tasks/:id', (req, res) => {
    const { completed, notes } = req.body;
    const now = completed ? new Date().toISOString() : null;
    db.prepare('UPDATE apex_tasks SET completed=?, completed_at=?, notes=? WHERE id=?')
      .run(completed ? 1 : 0, now, notes || '', req.params.id);
    res.json({ success: true });
  });

  // Get apex info
  router.get('/info', (req, res) => {
    const info = db.prepare('SELECT * FROM apex_info WHERE id=1').get();
    res.json(info || { id: 1, github_url: '', live_url: '' });
  });

  // Update apex info
  router.put('/info', (req, res) => {
    const { github_url, live_url } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE apex_info SET github_url=?, live_url=?, updated_at=? WHERE id=1')
      .run(github_url || '', live_url || '', now);
    res.json({ success: true });
  });

  // Get daily logs
  router.get('/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM apex_logs ORDER BY date DESC LIMIT 100').all();
    res.json(logs);
  });

  // Add/update daily log
  router.post('/logs', (req, res) => {
    const { date, built_today, blockers, next_steps } = req.body;
    const existing = db.prepare('SELECT id FROM apex_logs WHERE date=?').get(date);
    if (existing) {
      db.prepare('UPDATE apex_logs SET built_today=?, blockers=?, next_steps=? WHERE date=?')
        .run(built_today || '', blockers || '', next_steps || '', date);
      res.json({ success: true, id: existing.id });
    } else {
      const result = db.prepare('INSERT INTO apex_logs (date, built_today, blockers, next_steps) VALUES (?,?,?,?)')
        .run(date, built_today || '', blockers || '', next_steps || '');
      res.json({ success: true, id: result.lastInsertRowid });
    }
  });

  // Get overall progress stats
  router.get('/stats', (req, res) => {
    const total = db.prepare('SELECT COUNT(*) as c FROM apex_tasks').get().c;
    const completed = db.prepare('SELECT COUNT(*) as c FROM apex_tasks WHERE completed=1').get().c;
    const byLayer = db.prepare(`
      SELECT layer, layer_name,
        COUNT(*) as total,
        SUM(completed) as completed
      FROM apex_tasks GROUP BY layer ORDER BY layer
    `).all();
    res.json({ total, completed, percentage: total > 0 ? Math.round((completed/total)*100) : 0, byLayer });
  });

  return router;
};
