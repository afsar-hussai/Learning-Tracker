import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';

const PHASE_NAMES = {
  1: { name: 'Phase 1 — Foundation', months: 'Month 1–2', color: '#00FF9C' },
  2: { name: 'Phase 2 — Cloud + Monitoring + IaC', months: 'Month 3–4', color: '#00B8FF' },
  3: { name: 'Phase 3 — MLOps Core', months: 'Month 5–7', color: '#FFB900' },
  4: { name: 'Phase 4 — LLMOps + Advanced', months: 'Month 8–12', color: '#FF6B35' },
};

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          className="star-btn"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star
            size={14}
            fill={(hover || value) >= s ? '#FFB900' : 'transparent'}
            color={(hover || value) >= s ? '#FFB900' : '#444'}
          />
        </button>
      ))}
    </div>
  );
}

function SkillRow({ skill, onSave }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(skill.status);
  const [confidence, setConfidence] = useState(skill.confidence || 0);
  const [notes, setNotes] = useState(skill.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateSkill(skill.id, { status, confidence, notes });
      toast.success('Skill updated!');
      onSave();
      setEditing(false);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const statusColor = { 'Not Started': '#444', 'In Progress': '#00B8FF', 'Completed': '#00FF9C' };

  return (
    <div className="border-b border-[#1E1E2E] last:border-0">
      <div
        className="flex items-center gap-3 py-3 cursor-pointer hover:bg-[#0D0D15] px-3 rounded-lg transition-colors"
        onClick={() => setEditing(!editing)}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{skill.name}</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: `${statusColor[status]}20`, color: statusColor[status], border: `1px solid ${statusColor[status]}40` }}>
              {status}
            </span>
            <StarRating value={confidence} onChange={() => {}} />
          </div>
        </div>
        {editing ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </div>

      {editing && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      borderColor: status === s ? statusColor[s] : '#1E1E2E',
                      background: status === s ? `${statusColor[s]}20` : 'transparent',
                      color: status === s ? statusColor[s] : '#666',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <StarRating value={confidence} onChange={setConfidence} />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Resources, progress notes..." rows={2} style={{ fontSize: 12 }} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs px-4 py-1.5 rounded-lg border border-[#1E1E2E] text-gray-500 hover:text-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseSection({ phase, skills, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);
  const info = PHASE_NAMES[phase];
  const total = skills.length;
  const completed = skills.filter(s => s.status === 'Completed').length;
  const inProgress = skills.filter(s => s.status === 'In Progress').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="card mb-4">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-mono font-bold text-sm" style={{ color: info.color }}>{info.name}</h2>
            <span className="text-xs text-gray-600">{info.months}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 progress-bar-container" style={{ maxWidth: 200 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: info.color }} />
            </div>
            <span className="text-xs font-mono" style={{ color: info.color }}>{pct}%</span>
            <span className="text-xs text-gray-500">{completed}/{total} done · {inProgress} in progress</span>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
      </div>

      {!collapsed && (
        <div className="mt-3 border-t border-[#1E1E2E] pt-2">
          {skills.map(skill => (
            <SkillRow key={skill.id} skill={skill} onSave={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSkills = useCallback(async () => {
    try {
      const data = await api.getSkills();
      setSkills(data.skills || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const byPhase = [1,2,3,4].reduce((acc, p) => {
    acc[p] = skills.filter(s => s.phase === p);
    return acc;
  }, {});

  const totalCompleted = skills.filter(s => s.status === 'Completed').length;
  const totalInProgress = skills.filter(s => s.status === 'In Progress').length;

  if (loading) return <div className="p-6 text-[#00FF9C] font-mono animate-pulse">Loading skills...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-mono font-bold text-[#00FF9C] mb-1">Tech Skills & Roadmap</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="text-[#00FF9C]">{totalCompleted} Completed</span>
          <span className="text-[#00B8FF]">{totalInProgress} In Progress</span>
          <span>{skills.length - totalCompleted - totalInProgress} Not Started</span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-mono text-white">Overall Progress</span>
          <span className="text-sm font-mono text-[#00FF9C]">{Math.round((totalCompleted/skills.length)*100)||0}%</span>
        </div>
        <div className="progress-bar-container mb-3">
          <div className="progress-bar-fill" style={{ width: `${(totalCompleted/skills.length)*100||0}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(p => {
            const ps = byPhase[p];
            const pct = ps.length > 0 ? Math.round((ps.filter(s=>s.status==='Completed').length/ps.length)*100) : 0;
            return (
              <div key={p} className="text-center">
                <div className="text-sm font-mono font-bold" style={{ color: PHASE_NAMES[p].color }}>{pct}%</div>
                <div className="text-xs text-gray-600">Phase {p}</div>
              </div>
            );
          })}
        </div>
      </div>

      {[1,2,3,4].map(p => (
        <PhaseSection key={p} phase={p} skills={byPhase[p]} onRefresh={loadSkills} />
      ))}
    </div>
  );
}
