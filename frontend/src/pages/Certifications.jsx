import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { Award, Calendar, DollarSign } from 'lucide-react';

const STATUS_OPTIONS = ['Not Started', 'Studying', 'Booked', 'Passed'];
const STATUS_COLORS = {
  'Not Started': '#444',
  'Studying': '#00B8FF',
  'Booked': '#FFB900',
  'Passed': '#00FF9C',
};

function CertCard({ cert, onSave }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(cert.status);
  const [examDate, setExamDate] = useState(cert.exam_date || '');
  const [score, setScore] = useState(cert.score || '');
  const [notes, setNotes] = useState(cert.notes || '');
  const [saving, setSaving] = useState(false);

  const daysRemaining = examDate ? Math.ceil((new Date(examDate) - new Date()) / 86400000) : null;

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateCert(cert.id, { status, exam_date: examDate, score, notes });
      toast.success('Certification updated!');
      onSave();
      setEditing(false);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const color = STATUS_COLORS[status];

  return (
    <div className="card mb-3" style={{ borderColor: status === 'Passed' ? 'rgba(0,255,156,0.3)' : '#1E1E2E' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Award size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-mono font-semibold text-sm text-white leading-tight">{cert.name}</h3>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs text-gray-500 hover:text-[#00B8FF] transition-colors flex-shrink-0"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {status}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <DollarSign size={10} />{cert.cost}
            </span>
            <span className="text-xs text-gray-500">Target: {cert.target_month}</span>
            {examDate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={10} /> {examDate}
              </span>
            )}
            {daysRemaining !== null && status !== 'Passed' && (
              <span className={`text-xs font-mono ${daysRemaining < 0 ? 'text-[#FF6B35]' : daysRemaining < 30 ? 'text-[#FFB900]' : 'text-gray-400'}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`}
              </span>
            )}
            {status === 'Passed' && score && (
              <span className="text-xs text-[#00FF9C] font-mono">Score: {score}</span>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-[#1E1E2E] space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-2">Status</div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    borderColor: status === s ? STATUS_COLORS[s] : '#1E1E2E',
                    background: status === s ? `${STATUS_COLORS[s]}20` : 'transparent',
                    color: status === s ? STATUS_COLORS[s] : '#666',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Exam Date</div>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Score (if passed)</div>
              <input type="text" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 89%" />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Study resources, preparation notes..." rows={2} style={{ fontSize: 12 }} />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Certifications() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCerts = useCallback(async () => {
    try {
      const data = await api.getSkills();
      setCerts(data.certifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCerts(); }, [loadCerts]);

  const passed = certs.filter(c => c.status === 'Passed').length;
  const totalCost = certs.reduce((sum, c) => sum + (c.cost || 0), 0);
  const spentCost = certs.filter(c => c.status === 'Passed' || c.status === 'Booked').reduce((sum, c) => sum + (c.cost || 0), 0);

  if (loading) return <div className="p-6 text-[#00FF9C] font-mono animate-pulse">Loading certifications...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-mono font-bold text-[#00FF9C] mb-4">Certifications</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-mono font-bold text-[#00FF9C]">{passed}/{certs.length}</div>
            <div className="text-xs text-gray-500">Earned</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-mono font-bold text-[#FFB900]">${spentCost}</div>
            <div className="text-xs text-gray-500">Invested</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-mono font-bold text-[#00B8FF]">${totalCost}</div>
            <div className="text-xs text-gray-500">Total Budget</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-white">Certification Progress</span>
            <span className="text-sm font-mono text-[#00FF9C]">{Math.round((passed/certs.length)*100)||0}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${(passed/certs.length)*100||0}%` }} />
          </div>
        </div>
      </div>

      {certs.map(cert => (
        <CertCard key={cert.id} cert={cert} onSave={loadCerts} />
      ))}
    </div>
  );
}
