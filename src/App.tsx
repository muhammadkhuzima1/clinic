import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { PatientLogin } from './pages/patient/PatientLogin';
import { PatientRegister } from './pages/patient/PatientRegister';
import { DoctorLogin } from './pages/doctor/DoctorLogin';
import { AdminLogin } from './pages/admin/AdminLogin';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientBookAppointment } from './pages/patient/PatientBookAppointment';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientProfile } from './pages/patient/PatientProfile';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorSchedule } from './pages/doctor/DoctorSchedule';
import { DoctorHistory } from './pages/doctor/DoctorHistory';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDoctors } from './pages/admin/AdminDoctors';
import { AdminPatients } from './pages/admin/AdminPatients';
import { AdminAppointments } from './pages/admin/AdminAppointments';

const AppContent: React.FC = () => {
  const { user, currentRole } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<string | undefined>(undefined);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookWithDoctor = (doctorId: string) => {
    setSelectedDoctorForBooking(doctorId);
    if (currentRole === 'patient') {
      setCurrentView('patient-book');
    } else {
      setCurrentView('patient-login');
    }
  };

  // Render Public or Authenticated Dashboard views
  const renderView = () => {
    switch (currentView) {
      // Public Views
      case 'home':
      case 'public-home':
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <HomePage onNavigate={handleNavigate} onBookWithDoctor={handleBookWithDoctor} />
          </PublicLayout>
        );

      case 'patient-login':
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <PatientLogin onNavigate={handleNavigate} />
          </PublicLayout>
        );

      case 'patient-register':
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <PatientRegister onNavigate={handleNavigate} />
          </PublicLayout>
        );

      case 'doctor-login':
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <DoctorLogin onNavigate={handleNavigate} />
          </PublicLayout>
        );

      case 'admin-login':
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <AdminLogin onNavigate={handleNavigate} />
          </PublicLayout>
        );

      // Patient Portal Views
      case 'patient-dashboard':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <PatientDashboard onNavigate={handleNavigate} onBookWithDoctor={handleBookWithDoctor} />
          </DashboardLayout>
        );

      case 'patient-book':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <PatientBookAppointment
              initialDoctorId={selectedDoctorForBooking}
              onAppointmentBooked={() => setCurrentView('patient-appointments')}
              onNavigate={handleNavigate}
            />
          </DashboardLayout>
        );

      case 'patient-appointments':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <PatientAppointments onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'patient-profile':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <PatientProfile />
          </DashboardLayout>
        );

      // Doctor Portal Views
      case 'doctor-dashboard':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <DoctorDashboard />
          </DashboardLayout>
        );

      case 'doctor-schedule':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <DoctorSchedule />
          </DashboardLayout>
        );

      case 'doctor-history':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <DoctorHistory />
          </DashboardLayout>
        );

      // Admin Portal Views
      case 'admin-dashboard':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <AdminDashboard onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'admin-doctors':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <AdminDoctors />
          </DashboardLayout>
        );

      case 'admin-patients':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <AdminPatients />
          </DashboardLayout>
        );

      case 'admin-appointments':
        return (
          <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
            <AdminAppointments />
          </DashboardLayout>
        );

      default:
        return (
          <PublicLayout onNavigate={handleNavigate}>
            <HomePage onNavigate={handleNavigate} onBookWithDoctor={handleBookWithDoctor} />
          </PublicLayout>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {renderView()}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
