'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, FileText } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

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
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Knowledge Base Registry"
        subtitle="Governing methodology, positioning files, non-negotiable compliance rules, and core strategy playbooks."
        status="ACTIVE"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-1 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2">Playbooks</h3>
          {files.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No playbook files loaded</p>
          ) : (
            files.map((file: string) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedFile === file
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> {file}
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
            <FileText className="w-5 h-5 text-[#2563EB]" /> Playbook: {selectedFile}
          </h2>
          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] font-mono text-xs text-[#475569] leading-relaxed whitespace-pre-wrap min-h-[300px]">
            {`Governing Knowledge Base File: /knowledge/${selectedFile}\n\nThis file rules AI prompt templates, opportunity formulation metrics, non-negotiable compliance parameters, and validation scoring.`}
          </div>
        </div>
      </div>
    </div>
  );
}
