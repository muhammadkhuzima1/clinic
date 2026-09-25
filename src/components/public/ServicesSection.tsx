import React, { useState } from 'react';
import { CLINIC_SERVICES } from '../../data/mockData';
import {
  Stethoscope,
  Baby,
  HeartHandshake,
  Activity,
  Bone,
  Sparkles,
  FlaskConical,
  Bandage,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ServicesSectionProps {
  onSelectService?: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Primary Care', 'Child Health', 'Maternal Health', 'Specialty Care', 'Diagnostic Facility'];

  const filteredServices = selectedCategory === 'All'
    ? CLINIC_SERVICES
    : CLINIC_SERVICES.filter(s => s.category === selectedCategory);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Stethoscope': return <Stethoscope className="w-6 h-6 text-teal-600" />;
      case 'Baby': return <Baby className="w-6 h-6 text-emerald-600" />;
      case 'HeartHandshake': return <HeartHandshake className="w-6 h-6 text-rose-600" />;
      case 'Activity': return <Activity className="w-6 h-6 text-blue-600" />;
      case 'Bone': return <Bone className="w-6 h-6 text-amber-600" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-purple-600" />;
      case 'FlaskConical': return <FlaskConical className="w-6 h-6 text-cyan-600" />;
      case 'Bandage': return <Bandage className="w-6 h-6 text-orange-600" />;
      default: return <Stethoscope className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    <section id="services-section" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Our Medical Departments
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Comprehensive Clinical Services
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            From pediatric immunizations to cardiology examinations and on-site clinical lab testing, Nowshera Family Clinic delivers high-standard clinical care for your loved ones.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 hover:border-teal-300 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {getServiceIcon(service.icon)}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium text-teal-700">{service.category}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Starting Fee</span>
                  <span className="text-sm font-bold text-slate-900">PKR {service.startingFee.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectService && onSelectService(service.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-100/70 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
