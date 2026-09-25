import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Doctor } from '../../types';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, Save, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DoctorSchedule: React.FC = () => {
  const { user, activeDoctor } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(activeDoctor || null);
  const [loading, setLoading] = useState(true);

  const [availableDays, setAvailableDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('15:00');
  const [isActive, setIsActive] = useState(true);
  const [leaveDays, setLeaveDays] = useState<string[]>([]);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const docId = activeDoctor?.id || user?.id || user?.doctorId;
      if (!docId) {
        setLoading(false);
        return;
      }
      const currentDoc = await supabaseService.getDoctorById(docId);
      if (currentDoc) {
        setDoctor(currentDoc);
        if (currentDoc.availableDays && currentDoc.availableDays.length > 0) {
          setAvailableDays(currentDoc.availableDays);
        }
        if (currentDoc.availableHours?.start) {
          setStartTime(currentDoc.availableHours.start.slice(0, 5));
        }
        if (currentDoc.availableHours?.end) {
          setEndTime(currentDoc.availableHours.end.slice(0, 5));
        }
        if (currentDoc.isActive !== undefined) {
          setIsActive(currentDoc.isActive);
        }
        if (currentDoc.leaves) {
          setLeaveDays(currentDoc.leaves);
        }
      }
    } catch (err) {
      console.error('Error loading doctor schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [user?.id, activeDoctor?.id]);

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleAddLeaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveDate || !doctor?.id) return;
    if (leaveDays.includes(newLeaveDate)) return;

    try {
      await supabaseService.addDoctorLeave(doctor.id, newLeaveDate);
      const updatedLeaves = [...leaveDays, newLeaveDate].sort();
      setLeaveDays(updatedLeaves);
      setNewLeaveDate('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add leave date.');
    }
  };

  const handleRemoveLeaveDay = async (dateStr: string) => {
    if (!doctor?.id) return;
    try {
      await supabaseService.removeDoctorLeave(doctor.id, dateStr);
      setLeaveDays(leaveDays.filter((d) => d !== dateStr));
    } catch (err: any) {
      setError(err?.message || 'Failed to remove leave date.');
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor?.id) return;

    if (isActive && availableDays.length === 0) {
      setError('Please select at least one available consultation day or deactivate new bookings.');
      return;
    }

    if (startTime >= endTime) {
      setError('Consultation start time must be earlier than end time.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await supabaseService.updateDoctorAvailability(doctor.id, {
        availableDays,
        availableHours: {
          start: startTime,
          end: endTime,
        },
        isActive,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-slate-400">
        Loading schedule from database...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule & Availability Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure weekly OPD consultation hours and block off leave or conference dates
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Doctor availability and working hours saved successfully to Supabase.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* OPD Working Hours Form */}
      <form onSubmit={handleSaveSchedule} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">OPD Weekly Roster</h3>
            <p className="text-xs text-slate-500">Days when appointments can be booked at Nowshera Clinic</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Active for New Bookings</span>
          </label>
        </div>

        {/* Days of week selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Available Consultation Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {day.slice(0, 3)}
                  <span className="block text-[10px] opacity-80 font-normal mt-0.5">
                    {isSelected ? 'Open' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OPD Chamber Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Patient consultations commence from this hour</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OPD Chamber End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Slots are generated in 30-minute intervals</span>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            id="save-doctor-schedule-btn"
            type="submit"
            disabled={isSaving || !doctor?.id}
            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Update Consultation Hours'}</span>
          </button>
        </div>
      </form>

      {/* Leave & Vacation Days */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Manage Leave & Absence Days</h3>
          <p className="text-xs text-slate-500">
            Dates marked here will automatically be unavailable in patient booking slots
          </p>
        </div>

        <form onSubmit={handleAddLeaveDay} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={newLeaveDate}
            onChange={(e) => setNewLeaveDate(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={!newLeaveDate || !doctor?.id}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              newLeaveDate && doctor?.id
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Leave Date</span>
          </button>
        </form>

        <div className="pt-3">
          <span className="text-xs font-bold text-slate-700 block mb-2">
            Scheduled Leave Dates ({leaveDays.length}):
          </span>

          {leaveDays.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No leave days recorded. You are fully available on all selected weekly roster days.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leaveDays.map((dateStr) => (
                <div
                  key={dateStr}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLeaveDay(dateStr)}
                    className="text-rose-500 hover:text-rose-800 p-0.5 rounded-sm"
                    title="Remove leave day"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
