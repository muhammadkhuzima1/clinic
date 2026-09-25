import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  Phone,
  Clock,
  Menu,
  X,
  User,
  ShieldCheck,
  Calendar,
  LogIn,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Clinic' },
    { id: 'services', label: 'Services' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'hours-location', label: 'Hours & Location' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(`public-${id}`);
    setMobileMenuOpen(false);
    setLoginDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro announcement / phone bar */}
      <div className="hidden lg:block bg-teal-800 text-teal-50 text-xs py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-300" />
              Direct Clinic Line: <strong>+92 923 551890</strong>
            </span>
            <span className="flex items-center gap-1.5 text-teal-200">
              <Clock className="w-3.5 h-3.5 text-teal-300" />
              OPD Hours: Mon–Fri 8:00 AM – 9:00 PM | Sat 9:00 AM – 6:00 PM
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-teal-200">
            <span>Nowshera Cantt, Khyber Pakhtunkhwa</span>
            <span className="text-teal-400">|</span>
            <span className="bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded font-semibold border border-rose-400/30">
              24/7 Urgent First-Aid
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-brand-logo"
          type="button"
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-3 text-left focus:outline-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/10">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight block leading-tight">
              Nowshera Family Clinic
            </span>
            <span className="text-xs text-teal-700 font-medium tracking-wide block">
              Patient Care & Specialist Consultations
            </span>
          </div>
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = activeTab === `public-${link.id}`;
            return (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right CTAs / Portal Access */}
        <div className="hidden sm:flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                id="nav-user-portal-btn"
                type="button"
                onClick={() => onNavigate(`${user.role}-dashboard`)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
              >
                {user.role === 'patient' && <User className="w-4 h-4 text-teal-600" />}
                {user.role === 'doctor' && <Stethoscope className="w-4 h-4 text-teal-600" />}
                {user.role === 'admin' && <ShieldCheck className="w-4 h-4 text-teal-600" />}
                <span>My {user.role.toUpperCase()} Portal</span>
              </button>
              <button
                id="nav-logout-btn"
                type="button"
                onClick={logout}
                className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1.5"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                id="nav-portals-dropdown-btn"
                type="button"
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Portal Logins</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {loginDropdownOpen && (
                <div
                  id="nav-portal-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Choose Portal
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onNavigate('patient-login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-medium block">Patient Portal</span>
                      <span className="text-xs text-slate-400">Appointments & History</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onNavigate('doctor-login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors"
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-medium block">Doctor Portal</span>
                      <span className="text-xs text-slate-400">Consultations & Notes</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onNavigate('admin-login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-medium block">Admin Portal</span>
                      <span className="text-xs text-slate-400">Clinic Management & Stats</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Direct "Book Appointment" button */}
          <button
            id="nav-book-appointment-btn"
            type="button"
            onClick={() => {
              if (user?.role === 'patient') {
                onNavigate('patient-book');
              } else {
                onNavigate('patient-login');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-700/20 active:scale-98 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Mobile Hamburger button */}
        <button
          id="mobile-menu-toggle"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drop-down navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleLinkClick(link.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-medium ${
                activeTab === `public-${link.id}`
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                onNavigate('patient-login');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>Patient Portal Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('doctor-login');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Doctor Portal Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('admin-login');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Admin Management Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate(user?.role === 'patient' ? 'patient-book' : 'patient-login');
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-center flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
