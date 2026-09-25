/**
 * Nowshera Family Clinic - Appointment Policies & Constraints
 * Enforces the mandatory 2-hour cutoff rule for patient rescheduling and cancellations.
 */

export interface PolicyCheckResult {
  isAllowed: boolean;
  hoursRemaining: number;
  reason?: string;
}

/**
 * Checks if an appointment can be cancelled or rescheduled by a patient.
 * Rule: Cancellation and rescheduling are only permitted at least 2 hours
 * before the scheduled appointment start time.
 */
export function checkTwoHourPolicy(
  appointmentDate: string,
  timeSlot: string
): PolicyCheckResult {
  if (!appointmentDate || !timeSlot) {
    return { isAllowed: true, hoursRemaining: 99 };
  }

  try {
    const [startPart] = timeSlot.split(' - ');
    const parts = (startPart || '09:00 AM').trim().split(' ');
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours)) hours = 9;
    if (isNaN(minutes)) minutes = 0;

    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = appointmentDate.split('-').map(Number);
    if (!year || !month || !day) {
      return { isAllowed: true, hoursRemaining: 99 };
    }

    const aptDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    const now = new Date();

    const diffMs = aptDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      return {
        isAllowed: false,
        hoursRemaining: Math.max(0, Number(diffHours.toFixed(1))),
        reason:
          'Appointments can only be cancelled or rescheduled at least 2 hours before the scheduled time. Within 2 hours, please contact the clinic front desk at +92 923 560123 for assistance.',
      };
    }

    return {
      isAllowed: true,
      hoursRemaining: Number(diffHours.toFixed(1)),
    };
  } catch (err) {
    console.warn('Error evaluating 2-hour policy:', err);
    return { isAllowed: true, hoursRemaining: 99 };
  }
}
