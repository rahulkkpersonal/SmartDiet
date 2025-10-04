import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-lg shadow-zinc-200/50 dark:shadow-black/20 p-6 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
      {children}
    </div>
  );
};