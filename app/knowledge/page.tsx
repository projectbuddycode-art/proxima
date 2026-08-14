'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, FileText } from 'lucide-react';

export default function KnowledgePage() {
  const [setupData, setSetupData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string>('company.md');
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    fetch('/api/setup')
      .then(res => res.json())
      .then(data => setSetupData(data));
  }, []);

  const files = setupData?.knowledgeBase?.files || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" /> Project Buddy Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All 15 governing sales methodology, positioning, offer playbooks, and truthfulness files loaded locally.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/60 border border-purple-800 text-purple-300 font-bold text-xs rounded-full">
          <CheckCircle2 className="w-4 h-4 text-purple-400" /> 15 Playbooks Loaded
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Loaded Playbooks</h3>
          {files.map((file: string) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                selectedFile === file
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> {file}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> File Preview: {selectedFile}
          </h2>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[300px]">
            {`Governing Knowledge Base File: /knowledge/${selectedFile}\n\nThis file governs AI Agent prompts, opportunity formulation, non-negotiable outreach rules, offer playbooks, and qualification scoring.`}
          </div>
        </div>
      </div>
    </div>
  );
}
