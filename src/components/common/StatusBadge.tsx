import React from 'react';
import { AppointmentStatus } from '../../types';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  const getStatusConfig = () => {
    const s = status ? status.trim().toLowerCase() : '';
    switch (s) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'pending':
        return {
          label: 'Pending',
          bg: 'bg-amber-50 text-amber-700 border border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: 'bg-teal-50 text-teal-700 border border-teal-200',
          dot: 'bg-teal-500',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bg: 'bg-rose-50 text-rose-700 border border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'cancelled':
      case 'canceled':
        return {
          label: 'Cancelled',
          bg: 'bg-slate-100 text-slate-600 border border-slate-200',
          dot: 'bg-slate-400',
        };
      case 'no-show':
      case 'noshow':
      case 'no_show':
        return {
          label: 'No-show',
          bg: 'bg-purple-50 text-purple-700 border border-purple-200',
          dot: 'bg-purple-500',
        };
      default:
        return {
          label: status || 'Pending',
          bg: 'bg-slate-50 text-slate-700 border border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
