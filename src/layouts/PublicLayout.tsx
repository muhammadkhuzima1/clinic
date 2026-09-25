import React from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';

interface PublicLayoutProps {
  activeTab?: string;
  onNavigate: (tab: string) => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  activeTab = 'home',
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar activeTab={activeTab} onNavigate={onNavigate} />
      <main className="flex-1">{children}</main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
