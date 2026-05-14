const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Get assessment status
  router.get('/assessment/status', (req, res) => {
    const done = db.prepare('SELECT done FROM assessment_done WHERE id=1').get();
    const results = db.prepare('SELECT * FROM assessment_results').all();
    res.json({ done: done ? done.done === 1 : false, results });
  });

  // Save assessment results
  router.post('/assessment/complete', (req, res) => {
    const { results } = req.body; // [{ pattern, level }]
    const update = db.prepare('UPDATE assessment_results SET level=?, completed=1 WHERE pattern=?');
    const tx = db.transaction(() => {
      for (const r of results) update.run(r.level, r.pattern);
    });
    tx();
    db.prepare('UPDATE assessment_done SET done=1 WHERE id=1').run();
    res.json({ success: true });
  });

  // Get today's problems (smart selection)
  router.get('/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const targetCount = isWeekend ? 3 : 2;

    // Already assigned today
    const existing = db.prepare(`
      SELECT ds.*, dp.title, dp.leetcode_num, dp.url, dp.difficulty, dp.pattern, dp.hints
      FROM dsa_sessions ds
      JOIN dsa_problems dp ON ds.problem_id = dp.id
      WHERE ds.date = ?
    `).all(today);

    if (existing.length >= targetCount) {
      return res.json({ problems: existing, target: targetCount, date: today });
    }

    // Get assessment levels
    const assessmentDone = db.prepare('SELECT done FROM assessment_done WHERE id=1').get();
    const assessmentResults = db.prepare('SELECT pattern, level FROM assessment_results').all();
    const weakPatterns = assessmentResults.filter(r => r.level === 'Weak').map(r => r.pattern);

    // Get recently practiced patterns (last 7 days)
    const recentPatterns = db.prepare(`
      SELECT DISTINCT dp.pattern FROM dsa_sessions ds
      JOIN dsa_problems dp ON ds.problem_id = dp.id
      WHERE ds.date >= date('now', '-7 days')
      ORDER BY ds.date DESC
    `).all().map(r => r.pattern);

    // Get already used problem IDs today
    const usedIds = existing.map(p => p.problem_id);

    // Get solved problem IDs (all time)
    const solvedIds = db.prepare(`SELECT DISTINCT problem_id FROM dsa_sessions WHERE status='solved'`).all().map(r => r.problem_id);

    const needed = targetCount - existing.length;
    const selected = [];

    // Priority 1: Weak pattern problems not yet solved
    if (assessmentDone && assessmentDone.done && weakPatterns.length > 0) {
      const placeholders = weakPatterns.map(() => '?').join(',');
      const candidates = db.prepare(`
        SELECT * FROM dsa_problems
        WHERE pattern IN (${placeholders})
        AND id NOT IN (${solvedIds.length ? solvedIds.join(',') : '0'})
        AND id NOT IN (${usedIds.length ? usedIds.join(',') : '0'})
        ORDER BY RANDOM()
        LIMIT ?
      `).all(...weakPatterns, needed);
      selected.push(...candidates);
    }

    // Priority 2: Patterns not recently practiced
    if (selected.length < needed && recentPatterns.length > 0) {
      const allIds = [...usedIds, ...selected.map(p => p.id), ...solvedIds];
      const excluded = allIds.length ? allIds.join(',') : '0';
      const candidates = db.prepare(`
        SELECT * FROM dsa_problems
        WHERE pattern NOT IN (${recentPatterns.map(() => '?').join(',')})
        AND id NOT IN (${excluded})
        ORDER BY RANDOM()
        LIMIT ?
      `).all(...recentPatterns, needed - selected.length);
      selected.push(...candidates);
    }

    // Priority 3: Any unsolved problem
    if (selected.length < needed) {
      const allIds = [...usedIds, ...selected.map(p => p.id), ...solvedIds];
      const excluded = allIds.length ? allIds.join(',') : '0';
      const candidates = db.prepare(`
        SELECT * FROM dsa_problems
        WHERE id NOT IN (${excluded})
        ORDER BY RANDOM()
        LIMIT ?
      `).all(needed - selected.length);
      selected.push(...candidates);
    }

    // Fallback: any problem not used today
    if (selected.length < needed) {
      const allIds = [...usedIds, ...selected.map(p => p.id)];
      const excluded = allIds.length ? allIds.join(',') : '0';
      const candidates = db.prepare(`
        SELECT * FROM dsa_problems
        WHERE id NOT IN (${excluded})
        ORDER BY RANDOM()
        LIMIT ?
      `).all(needed - selected.length);
      selected.push(...candidates);
    }

    // Create session entries for selected problems
    const insertSession = db.prepare(`INSERT INTO dsa_sessions (problem_id, date, status, notes) VALUES (?, ?, 'pending', '')`);
    const tx = db.transaction(() => {
      for (const p of selected) insertSession.run(p.id, today);
    });
    tx();

    const allToday = db.prepare(`
      SELECT ds.*, dp.title, dp.leetcode_num, dp.url, dp.difficulty, dp.pattern, dp.hints
      FROM dsa_sessions ds
      JOIN dsa_problems dp ON ds.problem_id = dp.id
      WHERE ds.date = ?
    `).all(today);

    res.json({ problems: allToday, target: targetCount, date: today });
  });

  // Get more similar problems (queue 3 more of same pattern)
  router.post('/more-similar', (req, res) => {
    const { pattern } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const usedToday = db.prepare('SELECT problem_id FROM dsa_sessions WHERE date=?').all(today).map(r => r.problem_id);
    const excluded = usedToday.length ? usedToday.join(',') : '0';

    const extras = db.prepare(`
      SELECT * FROM dsa_problems
      WHERE pattern = ? AND id NOT IN (${excluded})
      ORDER BY RANDOM()
      LIMIT 3
    `).all(pattern);

    const insertSession = db.prepare(`INSERT INTO dsa_sessions (problem_id, date, status, notes) VALUES (?, ?, 'pending', '')`);
    const tx = db.transaction(() => {
      for (const p of extras) insertSession.run(p.id, today);
    });
    tx();

    res.json({ added: extras.length, problems: extras });
  });

  // Update session status (solve/skip/need_revision)
  router.put('/session/:id', (req, res) => {
    const { status, notes } = req.body;
    const { id } = req.params;

    db.prepare('UPDATE dsa_sessions SET status=?, notes=? WHERE id=?').run(status, notes || '', id);

    if (status === 'solved') {
      const session = db.prepare('SELECT * FROM dsa_sessions WHERE id=?').get(id);
      if (session) {
        scheduleRevisions(session.problem_id);
      }
    }

    res.json({ success: true });
  });

  function scheduleRevisions(problemId) {
    const today = new Date();
    const intervals = [1, 2, 4, 7];
    const existing = db.prepare('SELECT COUNT(*) as c FROM revision_schedule WHERE problem_id=? AND completed=0').get(problemId);
    if (existing.c > 0) return; // Already scheduled

    const insert = db.prepare('INSERT OR IGNORE INTO revision_schedule (problem_id, due_date, revision_num) VALUES (?,?,?)');
    const tx = db.transaction(() => {
      intervals.forEach((days, i) => {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + days);
        insert.run(problemId, dueDate.toISOString().split('T')[0], i + 1);
      });
    });
    tx();
  }

  // Get all problems with filters
  router.get('/problems', (req, res) => {
    const { pattern, difficulty, status } = req.query;
    let query = 'SELECT dp.*, (SELECT ds.status FROM dsa_sessions ds WHERE ds.problem_id=dp.id AND ds.status="solved" LIMIT 1) as solved_status FROM dsa_problems dp WHERE 1=1';
    const params = [];
    if (pattern) { query += ' AND dp.pattern=?'; params.push(pattern); }
    if (difficulty) { query += ' AND dp.difficulty=?'; params.push(difficulty); }
    query += ' ORDER BY dp.pattern, dp.difficulty';
    const problems = db.prepare(query).all(...params);
    res.json(problems);
  });

  // Get stats
  router.get('/stats', (req, res) => {
    const totalSolved = db.prepare(`SELECT COUNT(DISTINCT problem_id) as c FROM dsa_sessions WHERE status='solved'`).get().c;
    const byDifficulty = db.prepare(`
      SELECT dp.difficulty, COUNT(DISTINCT ds.problem_id) as count
      FROM dsa_sessions ds JOIN dsa_problems dp ON ds.problem_id=dp.id
      WHERE ds.status='solved'
      GROUP BY dp.difficulty
    `).all();
    const byPattern = db.prepare(`
      SELECT dp.pattern, COUNT(DISTINCT ds.problem_id) as count
      FROM dsa_sessions ds JOIN dsa_problems dp ON ds.problem_id=dp.id
      WHERE ds.status='solved'
      GROUP BY dp.pattern
    `).all();

    // Streak calculation
    const dates = db.prepare(`
      SELECT date, COUNT(DISTINCT problem_id) as solved
      FROM dsa_sessions WHERE status='solved'
      GROUP BY date HAVING solved >= 2
      ORDER BY date DESC
    `).all();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const datesToday = db.prepare(`SELECT COUNT(DISTINCT problem_id) as c FROM dsa_sessions WHERE date=? AND status='solved'`).get(today);
    const startDate = datesToday.c >= 2 ? today : yesterday;

    let checkDate = new Date(startDate);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayData = dates.find(d => d.date === dateStr);
      if (dayData) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    tempStreak = 0;
    let prevDate = null;
    for (const d of [...dates].reverse()) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const prev = new Date(prevDate);
        const curr = new Date(d.date);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = d.date;
    }

    // Today's count
    const todayCount = db.prepare(`SELECT COUNT(DISTINCT problem_id) as c FROM dsa_sessions WHERE date=? AND status IN ('solved','skipped','need_revision')`).get(today).c;
    const todaySolved = db.prepare(`SELECT COUNT(DISTINCT problem_id) as c FROM dsa_sessions WHERE date=? AND status='solved'`).get(today).c;

    // Heatmap (last 60 days)
    const heatmap = db.prepare(`
      SELECT date, COUNT(DISTINCT problem_id) as count
      FROM dsa_sessions WHERE status='solved' AND date >= date('now', '-60 days')
      GROUP BY date
    `).all();

    res.json({ totalSolved, byDifficulty, byPattern, currentStreak, longestStreak, todayCount, todaySolved, heatmap });
  });

  // Get sessions history
  router.get('/history', (req, res) => {
    const history = db.prepare(`
      SELECT ds.*, dp.title, dp.difficulty, dp.pattern, dp.leetcode_num, dp.url
      FROM dsa_sessions ds JOIN dsa_problems dp ON ds.problem_id=dp.id
      WHERE ds.status IN ('solved','need_revision')
      ORDER BY ds.date DESC
      LIMIT 100
    `).all();
    res.json(history);
  });

  return router;
};
