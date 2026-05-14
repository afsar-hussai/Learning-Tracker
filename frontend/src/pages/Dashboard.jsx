import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Flame, Code2, RefreshCw, Building2, Target, Award, Zap } from 'lucide-react';

const QUOTES = [
  "The grind is the glory. Keep pushing.",
  "Every LeetCode problem is a step closer to the offer.",
  "DevOps is not a job title. It's a mindset.",
  "kubectl get dream --namespace=reality",
  "docker build --tag=future-self .",
  "Your pipeline is only as strong as its weakest stage.",
  "Terraform your skills. Apply every day.",
  "In MLOps, the model is never done. Neither are you.",
  "Ship it. Fix it. Ship it again.",
  "The best monitoring system is a curious engineer.",
  "Containers don't fail. Engineers learn.",
  "git commit -m 'built something that matters'",
  "Prometheus scrapes metrics. You should scrape knowledge.",
  "The cloud doesn't care about your excuses.",
  "An 18 LPA offer is just consistent effort over time.",
  "You're not behind. You're exactly where your effort placed you.",
  "LangChain links prompts. Link your days to your goal.",
  "Kubernetes scales apps. Discipline scales humans.",
  "Every CI pipeline you build is proof you can ship.",
  "Vector databases remember. Don't let your grind be forgotten.",
];

function ProgressRing({ value, max, size = 80, stroke = 6, color = '#00FF9C' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} className="ring-progress">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E1E2E" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}

function HeatmapCell({ count }) {
  let bg = '#1E1E2E';
  if (count >= 5) bg = '#00FF9C';
  else if (count >= 3) bg = '#00CC7A';
  else if (count >= 2) bg = '#009959';
  else if (count >= 1) bg = '#006633';
  return (
    <div
      className="heatmap-cell"
      style={{ background: bg }}
      title={`${count} solved`}
    />
  );
}

export default function Dashboard() {
  const [dsaStats, setDsaStats] = useState(null);
  const [todayProblems, setTodayProblems] = useState({ problems: [], target: 2 });
  const [revisions, setRevisions] = useState([]);
  const [apexStats, setApexStats] = useState(null);
  const [skillStats, setSkillStats] = useState(null);
  const [certs, setCerts] = useState([]);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    Promise.all([
      api.getDsaStats(),
      api.getTodayProblems(),
      api.getTodayRevisions(),
      api.getApexStats(),
      api.getSkillStats(),
      api.getSkills(),
    ]).then(([stats, today, revs, apex, skillS, skillData]) => {
      setDsaStats(stats);
      setTodayProblems(today);
      setRevisions(revs);
      setApexStats(apex);
      setSkillStats(skillS);
      setCerts(skillData.certifications || []);
    }).finally(() => setLoading(false));
  }, []);

  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const targetCount = isWeekend ? 3 : 2;
  const todaySolved = dsaStats?.todaySolved || 0;

  // Upcoming cert
  const upcomingCert = certs.find(c => c.status !== 'Passed');

  // Active phase
  const currentPhase = skillStats?.byPhase?.find(p => {
    const pct = p.total > 0 ? (p.completed / p.total) * 100 : 0;
    return pct < 100;
  });
  const phaseNames = { 1: 'Foundation', 2: 'Cloud + IaC', 3: 'MLOps Core', 4: 'LLMOps + Advanced' };

  // Last 7 days heatmap
  const heatmapData = [];
  if (dsaStats?.heatmap) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const entry = dsaStats.heatmap.find(h => h.date === dateKey);
      heatmapData.push({ date: dateKey, count: entry?.count || 0 });
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-[#00FF9C] font-mono animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold text-white mb-1">
          Hey Afsar! <span className="text-[#00FF9C]">👋</span>
        </h1>
        <p className="text-gray-500 text-sm">{dateStr}</p>
        <div className="mt-3 p-3 rounded-lg border border-[#1E1E2E] bg-[#0D0D15] text-sm text-gray-400 italic font-mono">
          "{quote}"
        </div>
      </div>

      {/* Alert banner */}
      {todaySolved < targetCount && (
        <div className="mb-4 p-3 rounded-lg border flex items-center gap-3"
          style={{ background: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
          <Zap size={16} />
          <span className="text-sm font-mono">
            ⚡ You need {targetCount} problems today! {todaySolved} done so far.
          </span>
          <Link to="/dsa" className="ml-auto text-xs underline">Go to DSA →</Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">

        {/* DSA Today */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={16} color="#00FF9C" />
            <h3 className="font-mono font-semibold text-sm text-white">DSA Today</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProgressRing value={todaySolved} max={targetCount} size={72} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-[#00FF9C]">{todaySolved}/{targetCount}</span>
              </div>
            </div>
            <div className="flex-1">
              {todayProblems.problems?.slice(0, 3).map((p, i) => (
                <div key={i} className="text-xs text-gray-400 mb-1 truncate">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${p.status === 'solved' ? 'bg-[#00FF9C]' : p.status === 'pending' ? 'bg-[#1E1E2E]' : 'bg-[#FF6B35]'}`} />
                  {p.title}
                </div>
              ))}
              <Link to="/dsa" className="text-xs text-[#00B8FF] hover:underline">View all →</Link>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} color="#FF6B35" />
            <h3 className="font-mono font-semibold text-sm text-white">Streak</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-[#FF6B35]">{dsaStats?.currentStreak || 0}</div>
              <div className="text-xs text-gray-500">Current 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-[#00B8FF]">{dsaStats?.longestStreak || 0}</div>
              <div className="text-xs text-gray-500">Longest 🏆</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-[#00FF9C]">{dsaStats?.totalSolved || 0}</div>
              <div className="text-xs text-gray-500">Total Solved</div>
            </div>
          </div>
          {/* Mini heatmap */}
          <div className="mt-3 flex gap-1">
            {heatmapData.map((d, i) => (
              <div key={i} className="flex-1">
                <HeatmapCell count={d.count} />
                <div className="text-[9px] text-gray-600 text-center mt-1">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revisions Due */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} color="#00B8FF" />
            <h3 className="font-mono font-semibold text-sm text-white">Revisions Due</h3>
            {revisions.length > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35' }}>
                {revisions.length}
              </span>
            )}
          </div>
          {revisions.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">No revisions due today ✅</div>
          ) : (
            <div className="space-y-2">
              {revisions.slice(0, 4).map((r, i) => {
                const isOverdue = r.due_date < new Date().toISOString().split('T')[0];
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-[#FF6B35]' : 'bg-[#00B8FF]'}`} />
                    <span className={`truncate ${isOverdue ? 'text-[#FF6B35]' : 'text-gray-300'}`}>{r.title}</span>
                    <span className="text-gray-600 ml-auto flex-shrink-0">Rev {r.revision_num}/4</span>
                  </div>
                );
              })}
              {revisions.length > 4 && (
                <Link to="/dsa" className="text-xs text-[#00B8FF] hover:underline">+{revisions.length - 4} more →</Link>
              )}
            </div>
          )}
        </div>

        {/* Apex Bank */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} color="#00B8FF" />
            <h3 className="font-mono font-semibold text-sm text-white">Apex Bank</h3>
          </div>
          {apexStats && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{apexStats.completed}/{apexStats.total} tasks</span>
                <span className="text-sm font-mono font-bold text-[#00FF9C]">{apexStats.percentage}%</span>
              </div>
              <div className="progress-bar-container mb-3">
                <div className="progress-bar-fill" style={{ width: `${apexStats.percentage}%` }} />
              </div>
              {apexStats.byLayer?.slice(0, 3).map(layer => (
                <div key={layer.layer} className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-gray-500 w-24 truncate">{layer.layer_name.split(' ')[0]}...</span>
                  <div className="flex-1 progress-bar-container" style={{ height: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${layer.total > 0 ? (layer.completed/layer.total)*100 : 0}%`, height: 4 }} />
                  </div>
                  <span className="text-gray-400 w-8 text-right">{layer.total > 0 ? Math.round((layer.completed/layer.total)*100) : 0}%</span>
                </div>
              ))}
              <Link to="/apexbank" className="text-xs text-[#00B8FF] hover:underline mt-1 block">View project →</Link>
            </>
          )}
        </div>

        {/* Active Roadmap Phase */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} color="#00FF9C" />
            <h3 className="font-mono font-semibold text-sm text-white">Active Phase</h3>
          </div>
          {currentPhase && (
            <>
              <div className="text-xs font-mono px-2 py-1 rounded mb-3 inline-block"
                style={{ background: 'rgba(0,255,156,0.1)', color: '#00FF9C', border: '1px solid rgba(0,255,156,0.3)' }}>
                Phase {currentPhase.phase} — {phaseNames[currentPhase.phase]}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{currentPhase.completed}/{currentPhase.total} skills</span>
                <span className="text-sm font-mono font-bold text-[#00FF9C]">
                  {currentPhase.total > 0 ? Math.round((currentPhase.completed/currentPhase.total)*100) : 0}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${currentPhase.total > 0 ? (currentPhase.completed/currentPhase.total)*100 : 0}%` }} />
              </div>
              <Link to="/skills" className="text-xs text-[#00B8FF] hover:underline mt-2 block">View roadmap →</Link>
            </>
          )}
          {!currentPhase && (
            <div className="text-sm text-[#00FF9C]">🏆 All phases complete!</div>
          )}
        </div>

        {/* Upcoming Cert */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} color="#FFB900" />
            <h3 className="font-mono font-semibold text-sm text-white">Next Certification</h3>
          </div>
          {upcomingCert ? (
            <>
              <div className="text-sm font-medium text-white mb-1 leading-tight">{upcomingCert.name}</div>
              <div className="text-xs text-gray-500 mb-2">Target: {upcomingCert.target_month}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{
                    background: upcomingCert.status === 'Studying' ? 'rgba(0,184,255,0.1)' : 'rgba(255,185,0,0.1)',
                    color: upcomingCert.status === 'Studying' ? '#00B8FF' : '#FFB900',
                    border: `1px solid ${upcomingCert.status === 'Studying' ? 'rgba(0,184,255,0.3)' : 'rgba(255,185,0,0.3)'}`,
                  }}>
                  {upcomingCert.status}
                </span>
                <span className="text-xs text-gray-500">${upcomingCert.cost}</span>
              </div>
              <Link to="/certifications" className="text-xs text-[#00B8FF] hover:underline mt-2 block">Manage certs →</Link>
            </>
          ) : (
            <div className="text-sm text-[#00FF9C]">🏆 All certs earned!</div>
          )}
        </div>
      </div>

      {/* LC Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono font-semibold text-sm text-white">LeetCode Progress → 500 Target</h3>
          <span className="text-sm font-mono font-bold text-[#00FF9C]">{dsaStats?.totalSolved || 0}/500</span>
        </div>
        <div className="progress-bar-container mb-3">
          <div className="progress-bar-fill" style={{ width: `${Math.min(((dsaStats?.totalSolved || 0)/500)*100, 100)}%` }} />
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          {dsaStats?.byDifficulty?.map(d => (
            <span key={d.difficulty}>
              <span className={d.difficulty === 'Easy' ? 'text-[#00FF9C]' : d.difficulty === 'Medium' ? 'text-[#FFB900]' : 'text-[#FF6B35]'}>
                {d.difficulty}
              </span>: {d.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
