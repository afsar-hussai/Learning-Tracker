const BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // DSA
  getAssessmentStatus: () => fetchJSON('/dsa/assessment/status'),
  completeAssessment: (results) => fetchJSON('/dsa/assessment/complete', { method: 'POST', body: JSON.stringify({ results }) }),
  getTodayProblems: () => fetchJSON('/dsa/today'),
  updateSession: (id, data) => fetchJSON(`/dsa/session/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMoreSimilar: (pattern) => fetchJSON('/dsa/more-similar', { method: 'POST', body: JSON.stringify({ pattern }) }),
  getDsaProblems: (params = {}) => fetchJSON('/dsa/problems?' + new URLSearchParams(params)),
  getDsaStats: () => fetchJSON('/dsa/stats'),
  getDsaHistory: () => fetchJSON('/dsa/history'),

  // Revision
  getTodayRevisions: () => fetchJSON('/revision/today'),
  completeRevision: (id) => fetchJSON(`/revision/complete/${id}`, { method: 'POST' }),
  getUpcomingRevisions: () => fetchJSON('/revision/upcoming'),

  // Skills
  getSkills: () => fetchJSON('/skills'),
  updateSkill: (id, data) => fetchJSON(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCert: (id, data) => fetchJSON(`/skills/cert/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSkillStats: () => fetchJSON('/skills/stats'),

  // Goals
  getMilestones: () => fetchJSON('/goals'),
  updateMilestone: (id, data) => fetchJSON(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Journal
  getJournalEntries: (params = {}) => fetchJSON('/journal?' + new URLSearchParams(params)),
  getTodayJournal: () => fetchJSON('/journal/today'),
  saveJournal: (data) => fetchJSON('/journal', { method: 'POST', body: JSON.stringify(data) }),

  // Apex Bank
  getApexTasks: () => fetchJSON('/apexbank/tasks'),
  updateApexTask: (id, data) => fetchJSON(`/apexbank/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getApexInfo: () => fetchJSON('/apexbank/info'),
  updateApexInfo: (data) => fetchJSON('/apexbank/info', { method: 'PUT', body: JSON.stringify(data) }),
  getApexLogs: () => fetchJSON('/apexbank/logs'),
  saveApexLog: (data) => fetchJSON('/apexbank/logs', { method: 'POST', body: JSON.stringify(data) }),
  getApexStats: () => fetchJSON('/apexbank/stats'),

  // Export / Import
  exportJSON: () => fetchJSON('/export/json'),
  importJSON: (data) => fetchJSON('/import/json', { method: 'POST', body: JSON.stringify(data) }),
};
