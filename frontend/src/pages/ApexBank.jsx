import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { ChevronDown, ChevronUp, ExternalLink, Github } from 'lucide-react';

const LAYER_COLORS = {
  1: '#00FF9C', 2: '#00B8FF', 3: '#FFB900', 4: '#FF6B35', 5: '#B44FFF', 6: '#FF4F9A'
};

const TECH_STACK = [
  { name: 'React', url: 'https://react.dev', category: 'Frontend' },
  { name: 'Node.js', url: 'https://nodejs.org', category: 'Backend' },
  { name: 'MongoDB', url: 'https://mongodb.com/docs', category: 'Database' },
  { name: 'Docker', url: 'https://docs.docker.com', category: 'DevOps' },
  { name: 'Kubernetes', url: 'https://kubernetes.io/docs', category: 'DevOps' },
  { name: 'Helm', url: 'https://helm.sh/docs', category: 'DevOps' },
  { name: 'ArgoCD', url: 'https://argo-cd.readthedocs.io', category: 'GitOps' },
  { name: 'Terraform', url: 'https://developer.hashicorp.com/terraform/docs', category: 'IaC' },
  { name: 'AWS EKS', url: 'https://docs.aws.amazon.com/eks', category: 'Cloud' },
  { name: 'GitHub Actions', url: 'https://docs.github.com/actions', category: 'CI/CD' },
  { name: 'Prometheus', url: 'https://prometheus.io/docs', category: 'Monitoring' },
  { name: 'Grafana', url: 'https://grafana.com/docs', category: 'Monitoring' },
  { name: 'MLflow', url: 'https://mlflow.org/docs', category: 'MLOps' },
  { name: 'FastAPI', url: 'https://fastapi.tiangolo.com', category: 'MLOps' },
  { name: 'DVC', url: 'https://dvc.org/doc', category: 'MLOps' },
  { name: 'Evidently AI', url: 'https://docs.evidentlyai.com', category: 'MLOps' },
  { name: 'LangChain', url: 'https://python.langchain.com/docs', category: 'LLMOps' },
  { name: 'ChromaDB', url: 'https://docs.trychroma.com', category: 'LLMOps' },
  { name: 'LangFuse', url: 'https://langfuse.com/docs', category: 'LLMOps' },
  { name: 'Trivy', url: 'https://aquasecurity.github.io/trivy', category: 'Security' },
  { name: 'OPA', url: 'https://www.openpolicyagent.org/docs', category: 'Security' },
  { name: 'Falco', url: 'https://falco.org/docs', category: 'Security' },
];

function LayerSection({ layer, layerName, tasks, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = LAYER_COLORS[layer] || '#00FF9C';

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
              {layer}
            </div>
            <h3 className="font-mono font-semibold text-sm text-white">Layer {layer} — {layerName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 progress-bar-container" style={{ maxWidth: 200 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
            <span className="text-xs text-gray-500">{completed}/{total}</span>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
      </div>

      {!collapsed && (
        <div className="mt-3 border-t border-[#1E1E2E] pt-3 space-y-2">
          {tasks.map(task => (
            <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={task.completed === 1}
                onChange={() => onToggle(task)}
                className="custom-checkbox"
              />
              <span className={`text-sm transition-colors ${task.completed ? 'line-through text-gray-600' : 'text-gray-300 group-hover:text-white'}`}>
                {task.task_name}
              </span>
              {task.completed && task.completed_at && (
                <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
                  {new Date(task.completed_at).toLocaleDateString()}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyLog({ logs, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === today);
  const [builtToday, setBuiltToday] = useState(todayLog?.built_today || '');
  const [blockers, setBlockers] = useState(todayLog?.blockers || '');
  const [nextSteps, setNextSteps] = useState(todayLog?.next_steps || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveApexLog({ date: today, built_today: builtToday, blockers, next_steps: nextSteps });
      toast.success('Daily log saved!');
      onSave();
    } catch {
      toast.error('Failed to save log.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card mb-6">
      <h3 className="font-mono font-semibold text-sm text-white mb-3">Today's Apex Bank Log</h3>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">🔨 What I built today</div>
          <textarea value={builtToday} onChange={e => setBuiltToday(e.target.value)} placeholder="Describe what you worked on..." rows={2} style={{ fontSize: 12 }} />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">🚧 Blockers</div>
          <textarea value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="Any blockers or issues..." rows={2} style={{ fontSize: 12 }} />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">⏭ Next Steps</div>
          <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="What to do next..." rows={2} style={{ fontSize: 12 }} />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
          {saving ? 'Saving...' : 'Save Log'}
        </button>
      </div>
    </div>
  );
}

export default function ApexBank() {
  const [tasks, setTasks] = useState([]);
  const [info, setInfo] = useState({ github_url: '', live_url: '' });
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [t, i, l, s] = await Promise.all([
        api.getApexTasks(),
        api.getApexInfo(),
        api.getApexLogs(),
        api.getApexStats(),
      ]);
      setTasks(t);
      setInfo(i);
      setGithubUrl(i.github_url || '');
      setLiveUrl(i.live_url || '');
      setLogs(l);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleToggleTask(task) {
    const newCompleted = task.completed ? 0 : 1;
    await api.updateApexTask(task.id, { completed: newCompleted, notes: task.notes || '' });
    toast.success(newCompleted ? '✅ Task completed!' : 'Task unchecked.');
    loadData();
  }

  async function handleSaveInfo() {
    setSavingInfo(true);
    try {
      await api.updateApexInfo({ github_url: githubUrl, live_url: liveUrl });
      toast.success('Project info saved!');
      loadData();
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSavingInfo(false);
    }
  }

  // Group tasks by layer
  const byLayer = {};
  tasks.forEach(t => {
    if (!byLayer[t.layer]) byLayer[t.layer] = { name: t.layer_name, tasks: [] };
    byLayer[t.layer].tasks.push(t);
  });

  // Find active layer (first incomplete)
  const activeLayer = Object.keys(byLayer).find(l => {
    const lt = byLayer[l].tasks;
    return lt.some(t => !t.completed);
  });

  if (loading) return <div className="p-6 text-[#00FF9C] font-mono animate-pulse">Loading Apex Bank...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Project Overview Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-mono font-bold text-[#00FF9C]">Apex Bank</h1>
              {activeLayer && (
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${LAYER_COLORS[activeLayer]}20`, color: LAYER_COLORS[activeLayer], border: `1px solid ${LAYER_COLORS[activeLayer]}40` }}>
                  Layer {activeLayer} Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-3">Full-stack Banking App with DevOps + MLOps pipeline</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-mono font-bold text-[#00FF9C]">{stats?.percentage || 0}%</span>
              <div className="flex-1 progress-bar-container" style={{ maxWidth: 200 }}>
                <div className="progress-bar-fill" style={{ width: `${stats?.percentage || 0}%` }} />
              </div>
              <span className="text-xs text-gray-500">{stats?.completed}/{stats?.total} tasks</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="GitHub repo URL..."
                  style={{ width: 220 }}
                />
                {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer"><Github size={14} className="text-gray-500 hover:text-[#00FF9C]" /></a>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  placeholder="Live URL..."
                  style={{ width: 180 }}
                />
                {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} className="text-gray-500 hover:text-[#00FF9C]" /></a>}
              </div>
              <button onClick={handleSaveInfo} disabled={savingInfo} className="btn-primary text-xs px-3 py-1.5">
                {savingInfo ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#1E1E2E]">
        {['tasks', 'log', 'techstack'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-[#00FF9C] text-[#00FF9C]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t === 'tasks' ? 'Task Layers' : t === 'log' ? 'Daily Log' : 'Tech Stack'}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          {Object.keys(byLayer).sort((a,b) => parseInt(a)-parseInt(b)).map(layer => (
            <LayerSection
              key={layer}
              layer={parseInt(layer)}
              layerName={byLayer[layer].name}
              tasks={byLayer[layer].tasks}
              onToggle={handleToggleTask}
            />
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div>
          <DailyLog logs={logs} onSave={loadData} />

          {/* Log timeline */}
          <h3 className="font-mono font-semibold text-sm text-white mb-3">Log Timeline</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500 text-sm">No logs yet. Start tracking your daily progress!</div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="card border-l-2" style={{ borderLeftColor: '#00B8FF' }}>
                  <div className="text-xs font-mono text-[#00B8FF] mb-2">{log.date}</div>
                  {log.built_today && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-0.5">Built:</div>
                      <div className="text-sm text-gray-300">{log.built_today}</div>
                    </div>
                  )}
                  {log.blockers && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-0.5">Blockers:</div>
                      <div className="text-sm text-[#FF6B35]">{log.blockers}</div>
                    </div>
                  )}
                  {log.next_steps && (
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">Next:</div>
                      <div className="text-sm text-gray-300">{log.next_steps}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'techstack' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {TECH_STACK.map(tech => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noreferrer"
                className="card flex flex-col gap-1 hover:border-[#00FF9C] hover:shadow-neon group"
              >
                <div className="font-mono font-semibold text-sm text-white group-hover:text-[#00FF9C] transition-colors">{tech.name}</div>
                <div className="text-xs text-gray-600">{tech.category}</div>
                <ExternalLink size={10} className="text-gray-600 group-hover:text-[#00FF9C] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
