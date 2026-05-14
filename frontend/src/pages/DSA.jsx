import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Plus, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function HeatmapGrid({ heatmap }) {
  const cells = [];
  for (let i = 59; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const entry = heatmap?.find(h => h.date === key);
    const count = entry?.count || 0;
    let bg = '#1E1E2E';
    if (count >= 5) bg = '#00FF9C';
    else if (count >= 3) bg = '#00CC7A';
    else if (count >= 2) bg = '#009959';
    else if (count >= 1) bg = '#006633';
    cells.push(
      <div key={key} className="heatmap-cell" style={{ background: bg }} title={`${key}: ${count} solved`} />
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3 }}>
      {cells}
    </div>
  );
}

function ProblemCard({ problem, onUpdate }) {
  const [showHints, setShowHints] = useState(false);
  const [notes, setNotes] = useState(problem.notes || '');
  const [saving, setSaving] = useState(false);

  const hints = (() => {
    try { return JSON.parse(problem.hints || '[]'); } catch { return []; }
  })();

  async function handleStatus(status) {
    setSaving(true);
    try {
      await api.updateSession(problem.id, { status, notes });
      toast.success(status === 'solved' ? '✅ Solved! Revision scheduled.' : status === 'skipped' ? 'Skipped.' : '📌 Marked for revision.');
      onUpdate();
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMoreSimilar() {
    try {
      const res = await api.getMoreSimilar(problem.pattern);
      toast.success(`Added ${res.added} more ${problem.pattern} problems!`);
      onUpdate();
    } catch {
      toast.error('Failed to add more problems.');
    }
  }

  const statusColors = { solved: '#00FF9C', skipped: '#666', need_revision: '#FFB900', pending: '#1E1E2E', mastered: '#00B8FF' };
  const isSolved = problem.status === 'solved' || problem.status === 'mastered';

  return (
    <div className="card mb-3 transition-all" style={{ borderColor: isSolved ? 'rgba(0,255,156,0.2)' : '#1E1E2E' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={problem.difficulty === 'Easy' ? 'badge-easy' : problem.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}>
              {problem.difficulty}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(0,184,255,0.1)', color: '#00B8FF', border: '1px solid rgba(0,184,255,0.2)' }}>
              {problem.pattern}
            </span>
            {problem.status === 'mastered' && <span className="text-xs">🏆 Mastered</span>}
            {problem.status === 'solved' && <span className="text-xs text-[#00FF9C]">✅ Solved</span>}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-semibold text-white text-sm">{problem.title}</h3>
            {problem.leetcode_num && (
              <a href={problem.url} target="_blank" rel="noreferrer"
                className="text-gray-500 hover:text-[#00B8FF] transition-colors">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          {problem.leetcode_num && (
            <div className="text-xs text-gray-600 font-mono mt-0.5">LC #{problem.leetcode_num}</div>
          )}
        </div>
        <button
          onClick={() => setShowHints(!showHints)}
          className="text-gray-500 hover:text-[#00B8FF] transition-colors flex-shrink-0"
        >
          {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showHints && hints.length > 0 && (
        <div className="mt-3 p-3 rounded-lg text-sm space-y-1" style={{ background: 'rgba(0,184,255,0.05)', border: '1px solid rgba(0,184,255,0.1)' }}>
          <div className="text-xs font-mono text-[#00B8FF] mb-2">Hints:</div>
          {hints.map((h, i) => <div key={i} className="text-gray-400 text-xs">• {h}</div>)}
        </div>
      )}

      <div className="mt-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes (approach, time complexity, learnings)..."
          rows={2}
          className="text-xs"
          style={{ fontSize: 12 }}
        />
      </div>

      {!isSolved && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={() => handleStatus('solved')} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <CheckCircle size={12} /> Solved ✓
          </button>
          <button onClick={() => handleStatus('need_revision')} disabled={saving} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
            <Clock size={12} /> Need Revision
          </button>
          <button onClick={() => handleStatus('skipped')} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg border border-[#1E1E2E] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
            <XCircle size={12} /> Skip
          </button>
          <button onClick={handleMoreSimilar} disabled={saving} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-[#1E1E2E] text-gray-500 hover:text-[#00B8FF] flex items-center gap-1 transition-colors">
            <Plus size={12} /> More {problem.pattern}
          </button>
        </div>
      )}
    </div>
  );
}

function RevisionCard({ revision, onComplete }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = revision.due_date < today;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border mb-2 transition-all"
      style={{ borderColor: isOverdue ? 'rgba(255,107,53,0.3)' : 'rgba(0,184,255,0.2)', background: isOverdue ? 'rgba(255,107,53,0.04)' : 'rgba(0,184,255,0.04)' }}>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{revision.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={revision.difficulty === 'Easy' ? 'badge-easy' : revision.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}>{revision.difficulty}</span>
          <span className="text-xs text-gray-500">Rev {revision.revision_num}/4</span>
          <span className={`text-xs ${isOverdue ? 'text-[#FF6B35]' : 'text-[#00B8FF]'}`}>
            {isOverdue ? `Overdue: ${revision.due_date}` : `Due: ${revision.due_date}`}
          </span>
        </div>
      </div>
      <button onClick={() => onComplete(revision.id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
        <CheckCircle size={12} /> Done
      </button>
    </div>
  );
}

export default function DSA() {
  const [tab, setTab] = useState('today');
  const [todayData, setTodayData] = useState({ problems: [], target: 2 });
  const [revisions, setRevisions] = useState([]);
  const [stats, setStats] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [filterPattern, setFilterPattern] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [today, revs, s] = await Promise.all([
        api.getTodayProblems(),
        api.getTodayRevisions(),
        api.getDsaStats(),
      ]);
      setTodayData(today);
      setRevisions(revs);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllProblems = useCallback(async () => {
    const problems = await api.getDsaProblems({ pattern: filterPattern, difficulty: filterDiff });
    setAllProblems(problems);
  }, [filterPattern, filterDiff]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (tab === 'problems') loadAllProblems(); }, [tab, loadAllProblems]);

  async function handleCompleteRevision(id) {
    try {
      const res = await api.completeRevision(id);
      toast.success(res.mastered ? '🏆 Problem Mastered!' : '✅ Revision complete!');
      loadData();
    } catch {
      toast.error('Failed.');
    }
  }

  const PATTERNS = ['Sliding Window','Two Pointers','Fast & Slow Pointers','Binary Search','BFS/DFS Graphs','Dynamic Programming','Trees DFS/BFS','Heaps & Priority Queue','Backtracking','Monotonic Stack','Arrays & Hashing'];
  const todaySolved = todayData.problems?.filter(p => p.status === 'solved' || p.status === 'mastered').length || 0;
  const isWeekend = [0,6].includes(new Date().getDay());
  const target = isWeekend ? 3 : 2;

  const patternChartData = stats?.byPattern?.map(p => ({ name: p.pattern.split('/')[0].substring(0,12), count: p.count })) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-mono font-bold text-[#00FF9C]">DSA Tracker</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-mono">{stats?.totalSolved || 0}/500</span>
          <div className="w-24 progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.min(((stats?.totalSolved||0)/500)*100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Solved', value: stats?.totalSolved || 0, color: '#00FF9C' },
          { label: 'Current Streak', value: `${stats?.currentStreak || 0} 🔥`, color: '#FF6B35' },
          { label: 'Longest Streak', value: `${stats?.longestStreak || 0} 🏆`, color: '#00B8FF' },
          { label: 'Today', value: `${todaySolved}/${target}`, color: '#FFB900' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#1E1E2E]">
        {['today', 'revisions', 'problems', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-[#00FF9C] text-[#00FF9C]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t === 'today' ? "Today's Problems" : t === 'revisions' ? `Revisions (${revisions.length})` : t === 'problems' ? 'Problem Bank' : 'Stats'}
          </button>
        ))}
      </div>

      {/* Today tab */}
      {tab === 'today' && (
        <div>
          {todaySolved < target && (
            <div className="mb-4 p-3 rounded-lg border text-sm font-mono"
              style={{ background: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
              ⚡ Goal: {target} problems today. {todaySolved} done — {target - todaySolved} remaining!
            </div>
          )}
          {todaySolved >= target && (
            <div className="mb-4 p-3 rounded-lg border text-sm font-mono"
              style={{ background: 'rgba(0,255,156,0.08)', borderColor: 'rgba(0,255,156,0.3)', color: '#00FF9C' }}>
              🎯 Today's goal complete! Keep going for extra credit.
            </div>
          )}
          {loading ? (
            <div className="text-gray-500 font-mono text-sm animate-pulse">Loading problems...</div>
          ) : (
            todayData.problems?.map(p => (
              <ProblemCard key={p.id} problem={p} onUpdate={loadData} />
            ))
          )}
          {!loading && todayData.problems?.length === 0 && (
            <div className="text-gray-500 text-sm">No problems loaded yet. Refresh to get today's problems.</div>
          )}
        </div>
      )}

      {/* Revisions tab */}
      {tab === 'revisions' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} color="#00B8FF" />
            <h2 className="font-mono text-sm font-semibold text-[#00B8FF]">Due for Revision Today</h2>
          </div>
          {revisions.length === 0 ? (
            <div className="text-gray-500 text-sm py-4">No revisions due today. 🎉</div>
          ) : (
            revisions.map(r => (
              <RevisionCard key={r.id} revision={r} onComplete={handleCompleteRevision} />
            ))
          )}
        </div>
      )}

      {/* Problem Bank tab */}
      {tab === 'problems' && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={filterPattern} onChange={e => setFilterPattern(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Patterns</option>
              {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 mb-3">{allProblems.length} problems</div>
          <div className="space-y-2">
            {allProblems.map(p => (
              <div key={p.id} className="card flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={p.difficulty === 'Easy' ? 'badge-easy' : p.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}>{p.difficulty}</span>
                    <span className="text-xs text-gray-500 font-mono">#{p.leetcode_num}</span>
                    {p.solved_status === 'solved' && <span className="text-xs text-[#00FF9C]">✅</span>}
                  </div>
                  <div className="text-sm font-medium text-white">{p.title}</div>
                  <div className="text-xs text-gray-600">{p.pattern}</div>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer"
                  className="text-gray-500 hover:text-[#00B8FF] transition-colors">
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {/* Heatmap */}
          <div className="card">
            <h3 className="font-mono text-sm font-semibold text-white mb-3">Activity Heatmap (Last 60 Days)</h3>
            <HeatmapGrid heatmap={stats?.heatmap} />
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <span>Less</span>
              {['#1E1E2E','#006633','#009959','#00CC7A','#00FF9C'].map(c => (
                <div key={c} className="w-3 h-3 rounded" style={{ background: c }} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* By difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-mono text-sm font-semibold text-white mb-3">By Difficulty</h3>
              <div className="space-y-2">
                {stats?.byDifficulty?.map(d => (
                  <div key={d.difficulty} className="flex items-center gap-2">
                    <span className={`text-xs w-14 ${d.difficulty === 'Easy' ? 'text-[#00FF9C]' : d.difficulty === 'Medium' ? 'text-[#FFB900]' : 'text-[#FF6B35]'}`}>{d.difficulty}</span>
                    <div className="flex-1 progress-bar-container">
                      <div className="progress-bar-fill"
                        style={{
                          width: `${(d.count/Math.max(...(stats?.byDifficulty||[{count:1}]).map(x=>x.count)))*100}%`,
                          background: d.difficulty === 'Easy' ? '#00FF9C' : d.difficulty === 'Medium' ? '#FFB900' : '#FF6B35'
                        }} />
                    </div>
                    <span className="text-xs font-mono text-gray-400 w-6">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-mono text-sm font-semibold text-white mb-3">By Pattern</h3>
              {patternChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={patternChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9, fill: '#666' }} />
                    <Tooltip contentStyle={{ background: '#12121A', border: '1px solid #1E1E2E', color: '#E0E0E0', fontSize: 11 }} />
                    <Bar dataKey="count" fill="#00FF9C" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-500 text-sm">Solve problems to see stats.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
