const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Get today's revisions
  router.get('/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const revisions = db.prepare(`
      SELECT rs.*, dp.title, dp.leetcode_num, dp.url, dp.difficulty, dp.pattern
      FROM revision_schedule rs
      JOIN dsa_problems dp ON rs.problem_id = dp.id
      WHERE rs.completed = 0 AND rs.due_date <= ?
      ORDER BY rs.due_date ASC
    `).all(today);
    res.json(revisions);
  });

  // Get upcoming revisions
  router.get('/upcoming', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = db.prepare(`
      SELECT rs.*, dp.title, dp.leetcode_num, dp.url, dp.difficulty, dp.pattern
      FROM revision_schedule rs
      JOIN dsa_problems dp ON rs.problem_id = dp.id
      WHERE rs.completed = 0 AND rs.due_date > ?
      ORDER BY rs.due_date ASC
      LIMIT 20
    `).all(today);
    res.json(upcoming);
  });

  // Complete a revision
  router.post('/complete/:id', (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();

    const revision = db.prepare('SELECT * FROM revision_schedule WHERE id=?').get(id);
    if (!revision) return res.status(404).json({ error: 'Revision not found' });

    db.prepare('UPDATE revision_schedule SET completed=1, completed_at=? WHERE id=?').run(now, id);

    // Check if all 4 revisions done → mark mastered
    const remaining = db.prepare('SELECT COUNT(*) as c FROM revision_schedule WHERE problem_id=? AND completed=0').get(revision.problem_id);
    if (remaining.c === 0) {
      db.prepare(`UPDATE dsa_sessions SET status='mastered' WHERE problem_id=? AND status='solved'`).run(revision.problem_id);
    }

    res.json({ success: true, mastered: remaining.c === 0 });
  });

  // Get all revision history
  router.get('/history', (req, res) => {
    const history = db.prepare(`
      SELECT rs.*, dp.title, dp.difficulty, dp.pattern
      FROM revision_schedule rs
      JOIN dsa_problems dp ON rs.problem_id = dp.id
      WHERE rs.completed = 1
      ORDER BY rs.completed_at DESC
      LIMIT 50
    `).all();
    res.json(history);
  });

  return router;
};
