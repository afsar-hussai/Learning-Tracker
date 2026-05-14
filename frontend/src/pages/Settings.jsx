import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { Download, Upload, FileJson, FileSpreadsheet, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} color="#00FF9C" />
        <h2 className="font-mono font-semibold text-sm text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const jsonImportRef = useRef(null);
  const xlsxImportRef = useRef(null);

  async function handleExportJSON() {
    setExporting(true);
    try {
      const data = await api.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exported!');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      const data = await api.exportJSON();
      const wb = XLSX.utils.book_new();

      // DSA Problems sheet
      if (data.dsa_problems?.length) {
        const ws = XLSX.utils.json_to_sheet(data.dsa_problems.map(p => ({
          ID: p.id, Title: p.title, LeetCode_Num: p.leetcode_num,
          URL: p.url, Difficulty: p.difficulty, Pattern: p.pattern,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'DSA Problems');
      }

      // DSA Sessions sheet
      if (data.dsa_sessions?.length) {
        const ws = XLSX.utils.json_to_sheet(data.dsa_sessions.map(s => ({
          Problem_ID: s.problem_id, Date: s.date, Status: s.status, Notes: s.notes,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'DSA Sessions');
      }

      // Skills sheet
      if (data.skills?.length) {
        const ws = XLSX.utils.json_to_sheet(data.skills.map(s => ({
          Name: s.name, Phase: s.phase, Status: s.status,
          Confidence: s.confidence, Notes: s.notes, Last_Updated: s.last_updated,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Skills');
      }

      // Milestones sheet
      if (data.milestones?.length) {
        const ws = XLSX.utils.json_to_sheet(data.milestones.map(m => ({
          Month: m.month_num, Title: m.title, Description: m.description,
          Status: m.status, Target_Date: m.target_date, Notes: m.notes,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Milestones');
      }

      // Apex Bank Tasks sheet
      if (data.apex_tasks?.length) {
        const ws = XLSX.utils.json_to_sheet(data.apex_tasks.map(t => ({
          Layer: t.layer, Layer_Name: t.layer_name, Task: t.task_name,
          Completed: t.completed ? 'Yes' : 'No', Completed_At: t.completed_at,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Apex Bank Tasks');
      }

      // Journal sheet
      if (data.journal_entries?.length) {
        const ws = XLSX.utils.json_to_sheet(data.journal_entries.map(j => ({
          Date: j.date, Wins: j.wins, Learned: j.learned,
          Problems_Faced: j.problems_faced, Mood: j.mood, Energy: j.energy, Phase: j.phase,
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Journal');
      }

      XLSX.writeFile(wb, `learning-os-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel exported!');
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importJSON(data);
      toast.success('JSON imported successfully!');
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer);

      const data = {};
      if (wb.SheetNames.includes('DSA Sessions')) {
        data.dsa_sessions = XLSX.utils.sheet_to_json(wb.Sheets['DSA Sessions']).map(r => ({
          problem_id: r.Problem_ID, date: r.Date, status: r.Status, notes: r.Notes || '',
        }));
      }
      if (wb.SheetNames.includes('Skills')) {
        data.skills = XLSX.utils.sheet_to_json(wb.Sheets['Skills']).map(r => ({
          name: r.Name, status: r.Status || 'Not Started', confidence: r.Confidence || 0, notes: r.Notes || '',
        }));
      }
      if (wb.SheetNames.includes('Journal')) {
        data.journal_entries = XLSX.utils.sheet_to_json(wb.Sheets['Journal']).map(r => ({
          date: r.Date, learned: r.Learned || '', problems_faced: r.Problems_Faced || '',
          wins: r.Wins || '', mood: r.Mood || 3, energy: r.Energy || 3, phase: r.Phase || '',
        }));
      }

      await api.importJSON(data);
      toast.success('Excel imported successfully!');
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-mono font-bold text-[#00FF9C] mb-6">Settings & Data</h1>

      <Section title="Export Data" icon={Download}>
        <p className="text-sm text-gray-400 mb-4">Download a backup of all your progress data.</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
          >
            <FileJson size={14} /> Export JSON Backup
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet size={14} /> Export Excel (.xlsx)
          </button>
        </div>
        {exporting && <div className="text-xs text-gray-500 mt-2 font-mono animate-pulse">Preparing export...</div>}
      </Section>

      <Section title="Import Data" icon={Upload}>
        <p className="text-sm text-gray-400 mb-4">
          Restore data from a previous backup. This merges data — it won't delete existing records.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => jsonImportRef.current?.click()}
            disabled={importing}
            className="btn-primary flex items-center gap-2"
          >
            <FileJson size={14} /> Import JSON
          </button>
          <button
            onClick={() => xlsxImportRef.current?.click()}
            disabled={importing}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet size={14} /> Import Excel (.xlsx)
          </button>
        </div>
        <input ref={jsonImportRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
        <input ref={xlsxImportRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
        {importing && <div className="text-xs text-gray-500 mt-2 font-mono animate-pulse">Importing data...</div>}
      </Section>

      <Section title="About" icon={Database}>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-[#00FF9C]">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="font-mono text-gray-300">SQLite (./data/db.sqlite)</span>
          </div>
          <div className="flex justify-between">
            <span>Backend</span>
            <span className="font-mono text-gray-300">Node.js + Express</span>
          </div>
          <div className="flex justify-between">
            <span>Frontend</span>
            <span className="font-mono text-gray-300">React + Vite + TailwindCSS</span>
          </div>
          <div className="mt-4 p-3 rounded-lg border border-[#1E1E2E] bg-[#0D0D15] font-mono text-xs text-gray-500">
            <div className="text-[#00FF9C] mb-1"># Data Persistence</div>
            <div>SQLite file at ./data/db.sqlite on host</div>
            <div>Docker volume mount: ./data:/app/data</div>
            <div>docker-compose down → up = zero data loss</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
