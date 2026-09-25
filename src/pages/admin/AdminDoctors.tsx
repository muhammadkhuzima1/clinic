import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { Doctor } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Stethoscope,
  Plus,
  Edit2,
  Search,
  Power,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const docs = await supabaseService.getDoctors();
      setDoctors(docs);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Family Medicine',
    qualification: 'MBBS, FCPS',
    experienceYears: 8,
    roomNumber: 'OPD Chamber #101',
    consultationFee: 1500,
    email: '',
    password: '',
    phone: '+92 333 1122334',
    bio: 'Dedicated medical consultant providing primary and specialized healthcare in Nowshera.',
    startTime: '09:00',
    endTime: '15:00',
  });

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name,
      specialty: doc.specialty,
      qualification: doc.qualification,
      experienceYears: doc.experienceYears || 8,
      roomNumber: doc.roomNumber,
      consultationFee: doc.consultationFee,
      email: doc.email,
      password: '',
      phone: doc.phone,
      bio: doc.bio || '',
      startTime: doc.availableHours?.start ? doc.availableHours.start.slice(0, 5) : '09:00',
      endTime: doc.availableHours?.end ? doc.availableHours.end.slice(0, 5) : '15:00',
    });
    setStatusMessage(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedDoctor(null);
    setFormData({
      name: '',
      specialty: 'Pediatrics & Child Health',
      qualification: 'MBBS, FCPS (Pediatrics)',
      experienceYears: 7,
      roomNumber: `OPD Chamber #${101 + doctors.length}`,
      consultationFee: 1500,
      email: '',
      password: '',
      phone: '+92 333 9988776',
      bio: 'Consultant physician specializing in pediatric care and family wellness at Nowshera Clinic.',
      startTime: '09:00',
      endTime: '15:00',
    });
    setStatusMessage(null);
    setIsAddModalOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const nextState = await supabaseService.toggleDoctorActive(id);
      setDoctors(
        doctors.map((d) => (d.id === id ? { ...d, isActive: nextState } : d))
      );
    } catch (err) {
      console.error('Toggle doctor status error:', err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await supabaseService.updateDoctor(selectedDoctor.id, {
        name: formData.name,
        specialty: formData.specialty,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        roomNumber: formData.roomNumber,
        consultationFee: Number(formData.consultationFee),
        phone: formData.phone,
        bio: formData.bio,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update doctor');
      }

      await supabaseService.updateDoctorAvailability(selectedDoctor.id, {
        availableHours: {
          start: formData.startTime,
          end: formData.endTime,
        },
      });

      setIsEditModalOpen(false);
      await loadDoctors();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update doctor.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await supabaseService.addDoctor({
        name: formData.name,
        email: formData.email,
        password: formData.password || 'Doctor123!#',
        phone: formData.phone,
        specialty: formData.specialty,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears) || 5,
        consultationFee: Number(formData.consultationFee) || 1500,
        roomNumber: formData.roomNumber,
        bio: formData.bio,
        availableHours: {
          start: formData.startTime,
          end: formData.endTime,
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to register doctor');
      }

      setIsAddModalOpen(false);
      await loadDoctors();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create doctor.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor & Specialist Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add doctors, update OPD rooms and consultation fees, or toggle active duty
          </p>
        </div>

        <button
          id="admin-add-doctor-btn"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm hover:bg-teal-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Specialist</span>
        </button>
      </div>

      {/* Search toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search doctors by name, specialty, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} on record
        </span>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading doctors from Supabase...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No doctors registered yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? 'No doctors matched your search.'
              : 'Add your first clinical specialist above to enable patient appointment bookings.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specialist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              id={`admin-doc-${doc.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg border-2 border-slate-100 shrink-0">
                      {doc.avatar ? (
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        doc.name?.charAt(0) || 'D'
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                      <span className="text-xs font-semibold text-teal-700 block">{doc.specialty}</span>
                      <span className="text-[11px] text-slate-400">{doc.qualification}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(doc.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      doc.isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                    }`}
                    title={doc.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">OPD Chamber:</span>
                    <span className="font-semibold text-slate-800">{doc.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Hours:</span>
                    <span className="font-semibold text-slate-800">
                      {doc.availableHours?.start || '09:00'} - {doc.availableHours?.end || '15:00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee:</span>
                    <span className="font-bold text-teal-700">PKR {doc.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${doc.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {doc.isActive ? 'Active on OPD' : 'Deactivated / On Leave'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: #{doc.id.slice(0, 6)}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(doc)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Doctor Profile"
        subtitle={`Updating details for ${selectedDoctor?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
          {statusMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty</label>
              <input
                type="text"
                required
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
              <input
                type="text"
                required
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Chamber Room</label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (PKR)</label>
              <input
                type="number"
                required
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Start Hour</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD End Hour</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-xs font-semibold"
            >
              {isSubmitting ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Medical Specialist"
        subtitle="Register a new doctor to the Nowshera Family Clinic roster"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
          {statusMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Salman Farooqi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email *</label>
              <input
                type="email"
                required
                placeholder="doctor@nowsheraclinic.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password (leave empty for 'Doctor123!#')
              </label>
              <input
                type="password"
                placeholder="Doctor123!#"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+92 333 1122334"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty *</label>
              <input
                type="text"
                required
                placeholder="e.g. Orthopedic Surgery"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications *</label>
              <input
                type="text"
                required
                placeholder="e.g. MBBS, FCPS"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Chamber Room *</label>
              <input
                type="text"
                required
                placeholder="e.g. OPD Chamber #106"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (PKR) *</label>
              <input
                type="number"
                required
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Start Hour</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD End Hour</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-xs font-semibold"
            >
              {isSubmitting ? 'Registering...' : 'Add Specialist to Roster'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
