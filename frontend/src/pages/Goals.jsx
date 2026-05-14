import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { Target, CheckCircle, Clock, Calendar } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];
const STATUS_COLORS = { pending: '#444', in_progress: '#FFB900', completed: '#00FF9C' };
const STATUS_ICONS = { pending: Clock, in_progress: Target, completed: CheckCircle };

function MilestoneCard({ milestone, onSave }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(milestone.status);
  const [notes, setNotes] = useState(milestone.notes || '');
  const [targetDate, setTargetDate] = useState(milestone.target_date || '');
  const [saving, setSaving] = useState(false);

  const daysRemaining = targetDate ? Math.ceil((new Date(targetDate) - new Date()) / 86400000) : null;
  const color = STATUS_COLORS[status];
  const Icon = STATUS_ICONS[status];

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateMilestone(milestone.id, { status, notes, target_date: targetDate });
      toast.success('Milestone updated!');
      onSave();
      setEditing(false);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card mb-3" style={{ borderColor: status === 'completed' ? 'rgba(0,255,156,0.25)' : '#1E1E2E' }}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
            style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
            {milestone.month_num}
          </div>
          <Icon size={12} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-mono font-semibold text-sm text-white">{milestone.title}</h3>
            <button onClick={() => setEditing(!editing)} className="text-xs text-gray-500 hover:text-[#00B8FF] transition-colors flex-shrink-0">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{milestone.description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded capitalize font-mono"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {status.replace('_', ' ')}
            </span>
            {targetDate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={10} /> {targetDate}
              </span>
            )}
            {daysRemaining !== null && status !== 'completed' && (
              <span className={`text-xs font-mono ${daysRemaining < 0 ? 'text-[#FF6B35]' : daysRemaining < 30 ? 'text-[#FFB900]' : 'text-gray-500'}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`}
              </span>
            )}
          </div>
          {notes && !editing && <div className="mt-2 text-xs text-gray-500 italic">"{notes}"</div>}
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-[#1E1E2E] space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-2">Status</div>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all capitalize"
                  style={{
                    borderColor: status === s ? STATUS_COLORS[s] : '#1E1E2E',
                    background: status === s ? `${STATUS_COLORS[s]}15` : 'transparent',
                    color: status === s ? STATUS_COLORS[s] : '#666',
                  }}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Target Date</div>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ width: 'auto' }} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Progress notes..." rows={2} style={{ fontSize: 12 }} />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Goals() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMilestones = useCallback(async () => {
    try {
      const data = await api.getMilestones();
      setMilestones(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const completed = milestones.filter(m => m.status === 'completed').length;
  const inProgress = milestones.filter(m => m.status === 'in_progress').length;

  if (loading) return <div className="p-6 text-[#00FF9C] font-mono animate-pulse">Loading goals...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Big Goal */}
      <div className="mb-6 p-4 rounded-xl border-2 text-center"
        style={{ borderColor: '#00FF9C', background: 'rgba(0,255,156,0.05)' }}>
        <div className="text-3xl mb-2">🎯</div>
        <h1 className="text-xl font-mono font-bold text-[#00FF9C] neon-glow mb-1">
          Land 18+ LPA DevOps/MLOps/LLMOps Job Offer
        </h1>
        <p className="text-sm text-gray-400">20–50 LPA / $100K–160K US Remote</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-xl font-mono font-bold text-[#00FF9C]">{completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-mono font-bold text-[#FFB900]">{inProgress}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-mono font-bold text-[#00B8FF]">{milestones.length - completed - inProgress}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Timeline progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-mono text-white">12-Month Journey</span>
          <span className="text-sm font-mono text-[#00FF9C]">{Math.round((completed/milestones.length)*100)||0}%</span>
        </div>
        <div className="progress-bar-container mb-3">
          <div className="progress-bar-fill" style={{ width: `${(completed/milestones.length)*100||0}%` }} />
        </div>
        {/* Timeline dots */}
        <div className="flex items-center gap-0">
          {milestones.map((m, i) => (
            <React.Fragment key={m.id}>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all"
                style={{
                  background: m.status === 'completed' ? '#00FF9C' : m.status === 'in_progress' ? '#FFB900' : '#1E1E2E',
                  borderColor: m.status === 'completed' ? '#00FF9C' : m.status === 'in_progress' ? '#FFB900' : '#2A2A3E',
                }}
                title={`Month ${m.month_num}: ${m.title}`}
              />
              {i < milestones.length - 1 && (
                <div className="flex-1 h-0.5" style={{ background: i < completed - 1 ? '#00FF9C' : '#1E1E2E' }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Month 1</span><span>Month 12 🎯</span>
        </div>
      </div>

      {/* Milestones */}
      {milestones.map(m => (
        <MilestoneCard key={m.id} milestone={m} onSave={loadMilestones} />
      ))}
    </div>
  );
}
