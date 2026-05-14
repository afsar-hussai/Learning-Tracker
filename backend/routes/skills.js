const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const skills = db.prepare('SELECT * FROM skills ORDER BY phase, id').all();
    const certs = db.prepare('SELECT * FROM certifications ORDER BY id').all();
    res.json({ skills, certifications: certs });
  });

  router.put('/:id', (req, res) => {
    const { status, confidence, notes } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE skills SET status=?, confidence=?, notes=?, last_updated=? WHERE id=?')
      .run(status, confidence, notes || '', now, req.params.id);
    res.json({ success: true });
  });

  router.put('/cert/:id', (req, res) => {
    const { status, exam_date, score, notes } = req.body;
    db.prepare('UPDATE certifications SET status=?, exam_date=?, score=?, notes=? WHERE id=?')
      .run(status, exam_date || '', score || '', notes || '', req.params.id);
    res.json({ success: true });
  });

  router.get('/stats', (req, res) => {
    const byPhase = db.prepare(`
      SELECT phase,
        COUNT(*) as total,
        SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END) as in_progress
      FROM skills GROUP BY phase
    `).all();
    res.json({ byPhase });
  });

  return router;
};
