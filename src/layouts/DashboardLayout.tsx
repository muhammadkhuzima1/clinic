import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Clock,
  User,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Home,
  FileText,
  Settings,
  Bell,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  currentView: string;
  onNavigate: (view: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title = 'Portal Dashboard',
  subtitle,
  currentView,
  onNavigate,
  actions,
  children,
}) => {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Role specific menu items
  const getMenuItems = (): SidebarItem[] => {
    if (user?.role === 'patient') {
      return [
        { id: 'patient-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'patient-book', label: 'Book Appointment', icon: PlusCircle },
        { id: 'patient-appointments', label: 'My Appointments', icon: Calendar },
        { id: 'patient-profile', label: 'Patient Profile', icon: User },
      ];
    }

    if (user?.role === 'doctor') {
      return [
        { id: 'doctor-dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
        { id: 'doctor-schedule', label: 'Manage Availability', icon: CalendarDays },
        { id: 'doctor-history', label: 'Appointment History', icon: FileText },
      ];
    }

    if (user?.role === 'admin') {
      return [
        { id: 'admin-dashboard', label: 'Clinic Overview', icon: LayoutDashboard },
        { id: 'admin-doctors', label: 'Manage Doctors', icon: Stethoscope },
        { id: 'admin-patients', label: 'Patient Directory', icon: Users },
        { id: 'admin-appointments', label: 'All Appointments', icon: Calendar },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileSidebarOpen(false);
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'patient':
        return <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">Patient Account</span>;
      case 'doctor':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Consultant Doctor</span>;
      case 'admin':
        return <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Administrator</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Nowshera Clinic</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getRoleBadge()}
          <button
            type="button"
            onClick={() => onNavigate('public-home')}
            className="p-1.5 text-slate-500 hover:text-teal-700"
            title="Back to Public Website"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Clinic Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Nowshera Clinic</h2>
                <span className="text-[11px] text-teal-700 font-medium">Healthcare Portal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current User Snapshot */}
          <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-white shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Clinic User'}</p>
              <div className="mt-0.5">{getRoleBadge()}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {user?.role?.toUpperCase()} MENU
            </span>
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`sidebar-link-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <button
            id="sidebar-back-public-btn"
            type="button"
            onClick={() => onNavigate('public-home')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>View Public Website</span>
          </button>

          <button
            id="sidebar-logout-btn"
            type="button"
            onClick={() => {
              logout();
              onNavigate('public-home');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar for desktop */}
        <div className="hidden lg:flex items-center justify-between bg-white px-8 py-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <button
              type="button"
              onClick={() => onNavigate('public-home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Public Site</span>
            </button>
          </div>
        </div>

        {/* Mobile Page Title banner */}
        <div className="lg:hidden px-4 pt-4 pb-1">
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
          </div>
        </div>

        {/* Page Inner Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
