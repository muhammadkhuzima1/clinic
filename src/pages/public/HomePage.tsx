import React from 'react';
import { Hero } from '../../components/public/Hero';
import { ServicesSection } from '../../components/public/ServicesSection';
import { DoctorsSection } from '../../components/public/DoctorsSection';
import { AboutSection } from '../../components/public/AboutSection';
import { HoursLocationSection } from '../../components/public/HoursLocationSection';
import { ContactSection } from '../../components/public/ContactSection';
import { Doctor } from '../../types';

interface HomePageProps {
  doctors?: Doctor[];
  onNavigate: (view: string) => void;
  onBookDoctor?: (doctorId: string) => void;
  onBookWithDoctor?: (doctorId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  doctors,
  onNavigate,
  onBookDoctor,
  onBookWithDoctor,
}) => {
  const doctorList = doctors || [];
  const handleBooking = onBookDoctor || onBookWithDoctor || ((docId: string) => onNavigate('patient-book'));
  return (
    <div>
      <Hero
        onBookClick={() => onNavigate('patient-book')}
        onExploreDoctors={() => {
          const el = document.getElementById('doctors-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <AboutSection />

      <ServicesSection
        onSelectService={() => {
          onNavigate('patient-book');
        }}
      />

      <DoctorsSection
        doctors={doctorList}
        onBookWithDoctor={(doctorId) => {
          handleBooking(doctorId);
        }}
      />

      <HoursLocationSection />

      <ContactSection />
    </div>
  );
};
