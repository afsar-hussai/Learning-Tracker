import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { Search, Smile, Zap, BookOpen } from 'lucide-react';

const MOOD_LABELS = ['', '😫 Terrible', '😕 Bad', '😐 Okay', '😊 Good', '🔥 Amazing'];
const ENERGY_LABELS = ['', '💤 Drained', '😴 Low', '⚡ Medium', '🏃 High', '🚀 Full Power'];
const PHASES = ['Phase 1 — Foundation', 'Phase 2 — Cloud + IaC', 'Phase 3 — MLOps Core', 'Phase 4 — LLMOps + Advanced'];

function EntryCard({ entry }) {
  const moodColor = entry.mood >= 4 ? '#00FF9C' : entry.mood === 3 ? '#FFB900' : '#FF6B35';

  return (
    <div className="card mb-3 border-l-2" style={{ borderLeftColor: moodColor }}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="font-mono text-sm text-[#00B8FF]">{entry.date}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {entry.phase && (
            <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(0,184,255,0.1)', color: '#00B8FF' }}>
              {entry.phase}
            </span>
          )}
          <span>{MOOD_LABELS[entry.mood]}</span>
          <span>{ENERGY_LABELS[entry.energy]}</span>
        </div>
      </div>
      {entry.wins && (
        <div className="mb-2">
          <div className="text-xs text-[#00FF9C] font-mono mb-0.5">🏆 Wins</div>
          <div className="text-sm text-gray-300 leading-relaxed">{entry.wins}</div>
        </div>
      )}
      {entry.learned && (
        <div className="mb-2">
          <div className="text-xs text-[#00B8FF] font-mono mb-0.5">📚 Learned</div>
          <div className="text-sm text-gray-300 leading-relaxed">{entry.learned}</div>
        </div>
      )}
      {entry.problems_faced && (
        <div>
          <div className="text-xs text-[#FF6B35] font-mono mb-0.5">🚧 Problems Faced</div>
          <div className="text-sm text-gray-400 leading-relaxed">{entry.problems_faced}</div>
        </div>
      )}
    </div>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('write');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today,
    learned: '',
    problems_faced: '',
    wins: '',
    mood: 3,
    energy: 3,
    phase: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [all, todayJ] = await Promise.all([
        api.getJournalEntries({ limit: 50 }),
        api.getTodayJournal(),
      ]);
      setEntries(all);
      setTodayEntry(todayJ);
      if (todayJ) {
        setForm({
          date: todayJ.date,
          learned: todayJ.learned || '',
          problems_faced: todayJ.problems_faced || '',
          wins: todayJ.wins || '',
          mood: todayJ.mood || 3,
          energy: todayJ.energy || 3,
          phase: todayJ.phase || '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSearch() {
    try {
      const results = await api.getJournalEntries({ search, limit: 50 });
      setEntries(results);
    } catch {
      toast.error('Search failed.');
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveJournal(form);
      toast.success('Journal saved! 📝');
      loadData();
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function SliderRow({ label, icon: Icon, value, onChange, labels, color }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Icon size={12} />
            <span>{label}</span>
          </div>
          <span className="text-xs font-mono" style={{ color }}>{labels[value]}</span>
        </div>
        <input
          type="range" min={1} max={5} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full accent-neon-green"
          style={{ accentColor: color }}
        />
        <div className="flex justify-between text-xs text-gray-700 mt-1">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-[#00FF9C] font-mono animate-pulse">Loading journal...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-mono font-bold text-[#00FF9C]">Daily Journal</h1>
        <span className="text-sm text-gray-500 font-mono">{today}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#1E1E2E]">
        {['write', 'timeline'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-[#00FF9C] text-[#00FF9C]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t === 'write' ? "Today's Entry" : 'Timeline'}
          </button>
        ))}
      </div>

      {tab === 'write' && (
        <div className="card space-y-4">
          <div>
            <div className="text-xs text-[#00FF9C] font-mono mb-1">🏆 Wins Today</div>
            <textarea
              value={form.wins}
              onChange={e => setForm({ ...form, wins: e.target.value })}
              placeholder="What went well? Any victories, big or small..."
              rows={3}
            />
          </div>
          <div>
            <div className="text-xs text-[#00B8FF] font-mono mb-1">📚 What I Learned</div>
            <textarea
              value={form.learned}
              onChange={e => setForm({ ...form, learned: e.target.value })}
              placeholder="Key concepts, tools, insights learned today..."
              rows={3}
            />
          </div>
          <div>
            <div className="text-xs text-[#FF6B35] font-mono mb-1">🚧 Problems Faced</div>
            <textarea
              value={form.problems_faced}
              onChange={e => setForm({ ...form, problems_faced: e.target.value })}
              placeholder="What was hard? Any blockers or confusion?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SliderRow
              label="Mood" icon={Smile} value={form.mood}
              onChange={v => setForm({ ...form, mood: v })}
              labels={MOOD_LABELS} color="#00FF9C"
            />
            <SliderRow
              label="Energy" icon={Zap} value={form.energy}
              onChange={v => setForm({ ...form, energy: v })}
              labels={ENERGY_LABELS} color="#00B8FF"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Current Phase</div>
            <select value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })} style={{ width: 'auto' }}>
              <option value="">Select phase...</option>
              {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            <BookOpen size={14} />
            {saving ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      )}

      {tab === 'timeline' && (
        <div>
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search entries..."
                style={{ paddingLeft: 32 }}
              />
            </div>
            <button onClick={handleSearch} className="btn-secondary text-xs px-4">Search</button>
            {search && <button onClick={() => { setSearch(''); loadData(); }} className="btn-danger text-xs px-3">Clear</button>}
          </div>

          {entries.length === 0 ? (
            <div className="text-gray-500 text-sm py-4">No entries yet. Start journaling today!</div>
          ) : (
            entries.map(entry => <EntryCard key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}
