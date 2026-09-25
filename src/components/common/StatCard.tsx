import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'teal' | 'emerald' | 'blue' | 'amber' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'teal',
  trend,
}) => {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      iconBg: 'bg-teal-100',
      border: 'border-teal-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      border: 'border-emerald-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100',
      border: 'border-purple-100',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg} ${scheme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
