const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const milestones = db.prepare('SELECT * FROM milestones ORDER BY month_num').all();
    res.json(milestones);
  });

  router.put('/:id', (req, res) => {
    const { status, notes, target_date } = req.body;
    db.prepare('UPDATE milestones SET status=?, notes=?, target_date=? WHERE id=?')
      .run(status, notes || '', target_date || '', req.params.id);
    res.json({ success: true });
  });

  router.get('/stats', (req, res) => {
    const total = db.prepare('SELECT COUNT(*) as c FROM milestones').get().c;
    const done = db.prepare("SELECT COUNT(*) as c FROM milestones WHERE status='completed'").get().c;
    res.json({ total, completed: done, pending: total - done });
  });

  return router;
};
