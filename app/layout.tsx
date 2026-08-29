import './globals.css';
import React from 'react';
import ClientLayoutWrapper from './components/ClientLayoutWrapper';

export const metadata = {
  title: 'PROXIMA COMMANDER — Autonomous Growth Operating System',
  description: 'PROXIMA COMMANDER — AI CEO + GTM Commander + Development Commander for Project Buddy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light bg-slate-50 text-slate-900">
      <body>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
