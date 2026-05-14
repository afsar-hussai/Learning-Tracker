import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { ChevronRight, Brain } from 'lucide-react';

const ASSESSMENT_QUESTIONS = [
  {
    pattern: 'Arrays',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  },
  {
    pattern: 'Strings',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    description: 'Find the length of the longest substring without repeating characters in a given string.',
  },
  {
    pattern: 'LinkedList',
    title: 'Reverse a Linked List',
    difficulty: 'Easy',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
  },
  {
    pattern: 'Trees',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    description: 'Given the root of a binary tree, return its maximum depth (number of nodes along the longest path from root to leaf).',
  },
  {
    pattern: 'Graphs',
    title: 'Number of Islands',
    difficulty: 'Medium',
    description: 'Given a 2D grid of "1"s (land) and "0"s (water), count the number of islands using BFS/DFS.',
  },
  {
    pattern: 'Dynamic Programming',
    title: 'Coin Change',
    difficulty: 'Medium',
    description: 'Given coins of different denominations and a total amount, return the fewest number of coins needed to make up that amount.',
  },
  {
    pattern: 'Recursion',
    title: 'Generate Parentheses',
    difficulty: 'Medium',
    description: 'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
  },
  {
    pattern: 'Sorting',
    title: 'Sort Colors (Dutch National Flag)',
    difficulty: 'Medium',
    description: 'Given an array with red, white, and blue objects, sort them in-place using the Dutch national flag algorithm.',
  },
  {
    pattern: 'Binary Search',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    description: 'Given a rotated sorted array, search for a target value and return its index or -1 if not found.',
  },
  {
    pattern: 'Heaps',
    title: 'Find Median from Data Stream',
    difficulty: 'Hard',
    description: 'Design a data structure that supports adding integers and finding the median of all integers added so far.',
  },
];

const LEVELS = [
  { value: 'Strong', label: 'Solved it easily ✅', color: '#00FF9C', bg: 'rgba(0,255,156,0.1)', border: 'rgba(0,255,156,0.4)' },
  { value: 'Medium', label: 'Solved with hints 🤔', color: '#FFB900', bg: 'rgba(255,185,0,0.1)', border: 'rgba(255,185,0,0.4)' },
  { value: 'Weak', label: "Couldn't solve ❌", color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.4)' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0); // -1 = intro
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isIntro = step === -1;
  const q = ASSESSMENT_QUESTIONS[step] || null;
  const progress = step >= 0 ? Math.round(((step) / ASSESSMENT_QUESTIONS.length) * 100) : 0;

  function handleSelect(level) {
    setSelected(level);
  }

  function handleNext() {
    if (!selected) return;
    const newAnswers = { ...answers, [q.pattern]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (step + 1 >= ASSESSMENT_QUESTIONS.length) {
      // Submit
      setSubmitting(true);
      const results = Object.entries(newAnswers).map(([pattern, level]) => ({ pattern, level }));
      api.completeAssessment(results)
        .then(() => {
          toast.success('Assessment complete! Your roadmap is personalized.');
          onComplete();
        })
        .catch(() => toast.error('Failed to save. Try again.'))
        .finally(() => setSubmitting(false));
    } else {
      setStep(step + 1);
    }
  }

  if (step === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-3xl font-mono font-bold text-[#00FF9C] mb-2 neon-glow">Learning OS</h1>
            <p className="text-gray-400">Personal DevOps/MLOps/LLMOps Journey Tracker</p>
          </div>

          <div className="card mb-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={20} color="#00B8FF" />
              <h2 className="font-mono font-semibold text-[#00B8FF]">DSA Assessment</h2>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Before we show your dashboard, we'll run a quick 10-question DSA assessment to understand your current skill level.
              This helps us prioritize which topics to push daily.
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 10 questions, one per DSA pattern</li>
              <li>• 3 options: Solved easily / Solved with hints / Couldn't solve</li>
              <li>• Results stored permanently — never asked again</li>
              <li>• Takes about 2 minutes</li>
            </ul>
          </div>

          <button
            onClick={() => setStep(0)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            Start Assessment <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-500">Question {step + 1} of {ASSESSMENT_QUESTIONS.length}</span>
            <span className="text-xs font-mono text-[#00FF9C]">{progress}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,184,255,0.1)', color: '#00B8FF', border: '1px solid rgba(0,184,255,0.3)' }}>
              {q.pattern}
            </span>
            <span className={`${q.difficulty === 'Easy' ? 'badge-easy' : q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
              {q.difficulty}
            </span>
          </div>
          <h2 className="text-lg font-mono font-semibold text-white mb-3">{q.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{q.description}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className="w-full text-left p-4 rounded-xl border transition-all duration-200"
              style={{
                background: selected === level.value ? level.bg : 'rgba(18,18,26,0.8)',
                borderColor: selected === level.value ? level.border : '#1E1E2E',
                color: selected === level.value ? level.color : '#999',
                transform: selected === level.value ? 'scale(1.01)' : 'scale(1)',
                boxShadow: selected === level.value ? `0 0 15px ${level.bg}` : 'none',
              }}
            >
              <span className="font-medium text-sm">{level.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!selected || submitting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          style={{ opacity: !selected ? 0.5 : 1 }}
        >
          {submitting ? 'Saving...' : step + 1 >= ASSESSMENT_QUESTIONS.length ? 'Complete Assessment 🚀' : 'Next Question'}
          {!submitting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
